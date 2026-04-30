const validator = require('validator');

const buildError = (message) => ({
    error: { details: [{ message }] }
});

const loginSchema = {
    validate: (body) => {
        if (!body || typeof body !== 'object') return buildError('Invalid payload format');

        const errors = [];
        if (!body.email || !validator.isEmail(String(body.email))) {
            errors.push({ message: 'Valid email is required' });
        }
        if (!body.password || typeof body.password !== 'string' || body.password.trim() === '') {
            errors.push({ message: 'Password is required' });
        }

        if (errors.length > 0) return { error: { details: errors } };
        return { error: null };
    }
};

const registerSchema = {
    validate: (body) => {
        if (!body || typeof body !== 'object') return buildError('Invalid payload format');

        const errors = [];
        if (!body.name || validator.isEmpty(String(body.name).trim())) {
            errors.push({ message: 'Name is required' });
        }
        if (!body.email || !validator.isEmail(String(body.email))) {
            errors.push({ message: 'Valid email is required' });
        }
        if (!body.password || !validator.isLength(String(body.password), { min: 8 })) {
            errors.push({ message: 'Password must be at least 8 characters long' });
        }
        if (!body.otp || validator.isEmpty(String(body.otp).trim())) {
            errors.push({ message: 'OTP is required' });
        }
        if (body.termsAccepted !== true) {
            errors.push({ message: 'Terms must be accepted' });
        }
        if (body.privacyAccepted !== true) {
            errors.push({ message: 'Privacy policy must be accepted' });
        }

        if (errors.length > 0) return { error: { details: errors } };
        return { error: null };
    }
};

module.exports = {
    loginSchema,
    registerSchema
};
