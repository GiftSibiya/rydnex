const tableCrud = (name: string) => ({
  list: `/app-api/database/tables/${name}/select`,
  create: `/app-api/database/tables/${name}/insert`,
  update: `/app-api/database/tables/${name}/update`,
  delete: `/app-api/database/tables/${name}/delete`,
});

const routes = {
  auth: {
    logout: '/app-api/auth/auth/logout',
    login: '/app-api/auth/auth/login',
    register: '/app-api/auth/auth/register',
    refresh: '/app-api/auth/auth/refresh',
    sessionRefresh: '/app-api/auth/session/refresh',
    verifyOtp: '/app-api/auth/auth/verify-otp',
    resendOtp: '/app-api/auth/auth/resend-otp',
    updateProfile: '/app-api/auth/auth/update-user',
    sendPasswordResetOtp: '/app-api/auth/auth/forgot-password',
    verifyPasswordResetOtp: '/app-api/auth/auth/verify-forgot-password-otp',
    resetPassword: '/app-api/auth/auth/reset-password',
    forgotPasswordReset: '/app-api/auth/auth/reset-password',
    forgotPassword: '/app-api/auth/auth/forgot-password',
    verifyForgotPasswordOtp: '/app-api/auth/auth/verify-forgot-password-otp',
  },
  images: {
    upload: '/app-api/storage/files/upload',
  },
  vehicles: tableCrud('vehicles'),
  catalog: {
    makes: '/app-api/database/tables/vehicle_makes_catalog/select',
    models: '/app-api/database/tables/vehicle_models_catalog/select',
    trims: '/app-api/database/tables/vehicle_trims_catalog/select',
  },
  maintenance: {
    odometerLogs: tableCrud('odometer_logs'),
    fuelLogs: tableCrud('fuel_logs'),
    serviceLogs: tableCrud('service_logs'),
    repairLogs: tableCrud('repair_logs'),
    vehicleChecks: tableCrud('vehicle_checks'),
    partsLifeRules: tableCrud('parts_life_rules'),
    partReminders: tableCrud('part_reminders'),
  },
};

export default routes;
