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

import { ApplicationService, ApplicationServiceSetup } from './application_service';

type ApplicationServiceContract = PublicMethodsOf<ApplicationService>;

const createSetupContractMock = (): jest.Mocked<ApplicationServiceSetup> => ({
  mount: jest.fn(),
});
const createMock = (): jest.Mocked<ApplicationServiceContract> => {
  const mocked = {
    setup: jest.fn(),
    stop: jest.fn(),
  };

  mocked.setup.mockReturnValue(createSetupContractMock());

  return mocked;
};

export const applicationServiceMock = {
  create: createMock,
  createSetupContract: createSetupContractMock,
};
