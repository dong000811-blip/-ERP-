/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import ShelterDashboard from './components/ShelterDashboard';
import { ShelterProvider } from './context/ShelterContext';

export default function App() {
  return (
    <ShelterProvider>
      <ShelterDashboard />
    </ShelterProvider>
  );
}
