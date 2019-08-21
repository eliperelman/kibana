/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';
import moment from 'moment';
import { CoreSetup, Logger, Plugin, PluginInitializerContext } from 'src/core/server';
import { LicensingConfigType, LicensingPluginSubject } from './types';
import { LicensingConfig } from './licensing_config';
import { LicensingPluginSetup } from './licensing_plugin_setup';

export class LicensingPlugin implements Plugin<LicensingPluginSubject, LicensingPluginSubject> {
  private readonly logger: Logger;
  private readonly config$: Observable<LicensingConfig>;
  private poller$!: Observable<number>;
  private pollerSubscription!: Subscription;
  private service$!: LicensingPluginSubject;

  constructor(private readonly context: PluginInitializerContext) {
    this.logger = this.context.logger.get();
    this.config$ = this.context.config
      .create<LicensingConfigType | { config: LicensingConfigType }>()
      .pipe(
        map(config =>
          'config' in config
            ? new LicensingConfig(config.config, this.context.env)
            : new LicensingConfig(config, this.context.env)
        )
      );
  }

  private hasLicenseInfoChanged(newLicense: any) {
    const currentLicense = this.poller.subject$.getValue();

    if ((currentLicense && !newLicense) || (newLicense && !currentLicense)) {
      return true;
    }

    return (
      newLicense.type !== currentLicense.type ||
      newLicense.status !== currentLicense.status ||
      newLicense.expiry_date_in_millis !== currentLicense.expiryDateInMillis
    );
  }

  private async fetchInfo(core: CoreSetup, clusterSource: string, pollingFrequency: number) {
    this.logger.debug(
      `Calling [${clusterSource}] Elasticsearch _xpack API. Polling frequency: ${pollingFrequency}`
    );

    const cluster = await core.elasticsearch.dataClient$.pipe(first()).toPromise();

    try {
      const response = await cluster.callAsInternalUser('transport.request', {
        method: 'GET',
        path: '/_xpack',
      });
      const rawLicense = response && response.license;
      const features = (response && response.features) || {};
      const licenseInfoChanged = this.hasLicenseInfoChanged(rawLicense);

      if (!licenseInfoChanged) {
        return { license: false, error: null, features: null };
      }

      const currentLicense = this.poller.subject$.getValue();
      const licenseInfo = [
        'type' in rawLicense && `type: ${rawLicense.type}`,
        'status' in rawLicense && `status: ${rawLicense.status}`,
        'expiry_date_in_millis' in rawLicense &&
          `expiry date: ${moment(rawLicense.expiry_date_in_millis, 'x').format()}`,
      ]
        .filter(Boolean)
        .join(' | ');

      this.logger.info(
        `Imported ${currentLicense ? 'changed ' : ''}license information` +
          ` from Elasticsearch for the [${clusterSource}] cluster: ${licenseInfo}`
      );

      return { license: rawLicense, error: null, features };
    } catch (err) {
      this.logger.warn(
        `License information could not be obtained from Elasticsearch` +
          ` for the [${clusterSource}] cluster. ${err}`
      );

      return { license: null, error: err, features: {} };
    }
  }

  private create({ clusterSource, pollingFrequency }: LicensingConfig, core: CoreSetup) {
    if (this.service$) {
      return this.service$;
    }

    const service$ = new BehaviorSubject<LicensingPluginSetup>(
      new LicensingPluginSetup(null, {}, null, clusterSource)
    );

    this.poller$ = timer(pollingFrequency);
    this.pollerSubscription = this.poller$.subscribe(async value => {
      const { license, features, error } = await this.fetchInfo(
        core,
        clusterSource,
        pollingFrequency
      );

      if (license !== false) {
        service$.next(new LicensingPluginSetup(license, features, error, clusterSource));
      }
    );

    return this.poller;
  }

  public async setup(core: CoreSetup) {
    const config = await this.config$.pipe(first()).toPromise();
    const poller = this.create(config, core);

    return {
      license$: poller.subject$.asObservable(),
    };
  }

  public async start(core: CoreStart) {}

  public stop() {
    if (this.poller) {
      this.poller.unsubscribe();
    }
  }
}
