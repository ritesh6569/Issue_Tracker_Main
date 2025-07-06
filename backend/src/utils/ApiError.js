class ApiError extends Error {
    constructor(
        statusCode,
        message= "Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false;
        this.errors = errors
        this.errorCode = this.getErrorCodeFromStatus(statusCode);

        if (stack) {
            this.stack = stack
        } else{
            Error.captureStackTrace(this, this.constructor)
        }
    }

    // Get a user-friendly error code based on status code
    getErrorCodeFromStatus(statusCode) {
        switch (statusCode) {
            case 400: return "BAD_REQUEST";
            case 401: return "UNAUTHORIZED";
            case 403: return "FORBIDDEN";
            case 404: return "NOT_FOUND";
            case 409: return "CONFLICT";
            case 422: return "VALIDATION_ERROR";
            case 500: return "SERVER_ERROR";
            default: return "ERROR";
        }
    }

    // Format the error for HTTP response
    toJSON() {
        return {
            success: this.success,
            status: this.statusCode,
            errorCode: this.errorCode,
            message: this.message,
            errors: this.errors.length > 0 ? this.errors : undefined
        };
    }
}

export {ApiError}