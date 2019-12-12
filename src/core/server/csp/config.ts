/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { TypeOf, schema } from '@kbn/config-schema';

export type CspConfigType = TypeOf<typeof config.schema>;

const rules = [
  `script-src 'unsafe-eval' 'self'`,
  `worker-src blob: 'self'`,
  `style-src 'unsafe-inline' 'self'`,
];

export const config = {
  // TODO: Move this to server.csp using config deprecations
  // ? https://github.com/elastic/kibana/pull/52251
  path: 'csp',
  schema: schema.object({
    rules: schema.arrayOf(schema.string(), { defaultValue: rules }),
    directives: schema.string({
      // TODO: Consider making this bidirectional in the future
      validate: value => (value ? 'Specify `csp.rules` to compute `csp.directives`' : undefined),
      defaultValue: (context: { rules: string[] } = { rules }) => context.rules.join('; '),
    }),
    strict: schema.boolean({ defaultValue: true }),
    warnLegacyBrowsers: schema.boolean({ defaultValue: true }),
  }),
};
