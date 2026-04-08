const routes = {
  auth: {
    login: '/app-api/auth/auth/login',
    register: '/app-api/auth/auth/register',
    refresh: '/app-api/auth/auth/refresh',
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
  vehicles: {
    list: '/app-api/database/tables/vehicles/select',
    create: '/app-api/database/tables/vehicles/insert',
    update: '/app-api/database/tables/vehicles/update',
  },
  catalog: {
    makes: '/app-api/database/tables/vehicle_makes_catalog/select',
    models: '/app-api/database/tables/vehicle_models_catalog/select',
    trims: '/app-api/database/tables/vehicle_trims_catalog/select',
  },
  maintenance: {
    odometer: '/app-api/database/tables/odometer_logs',
    services: '/app-api/database/tables/service_logs',
    repairs: '/app-api/database/tables/repair_logs',
    fuel: '/app-api/database/tables/fuel_logs',
    checks: '/app-api/database/tables/vehicle_checks',
    partsRules: '/app-api/database/tables/parts_life_rules',
    reminders: '/app-api/database/tables/part_reminders',
  },
};

export default routes;