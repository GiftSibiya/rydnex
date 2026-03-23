export type ApiResponseType<T = unknown> = {
  success: boolean;
  message?: string;
  error?: string;
  data: T;
};

export type AuthUserRole = {
  id: number;
  role_key: string;
  role_name?: string;
};

export type AuthOrganisation = {
  id: number;
  name: string;
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  last_name?: string;
  roles?: AuthUserRole[];
};

export type LoginResponseData = {
  user: AuthUser;
  accessToken: string;
  organisation?: AuthOrganisation | null;
};

export type RegistrationResponseData = {
  user: AuthUser;
  accessToken: string;
};

export type Vehicle = {
  id: number;
  user_id: number;
  vin: string;
  registration_number: string;
  make: string;
  model: string;
  year?: number;
  engine?: string;
  notes?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type OdometerLog = {
  id: number;
  vehicle_id: number;
  reading_km: number;
  logged_at: string;
  note?: string;
};

export type FuelLog = {
  id: number;
  vehicle_id: number;
  odometer_km: number;
  litres: number;
  cost: number;
  fuel_level_percent?: number;
  logged_at: string;
};

export type ServiceLog = {
  id: number;
  vehicle_id: number;
  service_type: string;
  service_km: number;
  service_date: string;
  workshop_name?: string;
  cost?: number;
  notes?: string;
};

export type RepairLog = {
  id: number;
  vehicle_id: number;
  repair_type: string;
  repair_km: number;
  repair_date: string;
  cost?: number;
  notes?: string;
};

export type VehicleCheckType =
  | 'oil'
  | 'tyre_pressure'
  | 'coolant'
  | 'spare_wheel'
  | 'lights';

export type VehicleCheck = {
  id: number;
  vehicle_id: number;
  check_type: VehicleCheckType;
  status: 'good' | 'attention' | 'critical';
  checked_at: string;
  note?: string;
};

export type PartLifeRule = {
  id: number;
  vehicle_id: number;
  part_name: string;
  last_change_km: number;
  expected_life_km: number;
  warning_threshold_km: number;
};

export type PartReminder = {
  id: number;
  vehicle_id: number;
  part_name: string;
  due_at_km: number;
  remaining_km: number;
  status: 'ok' | 'warning' | 'due';
};