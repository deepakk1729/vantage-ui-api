import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);

// Compiling a schema is the expensive part of AJV — cache the compiled
// validator per distinct schema body so repeated calls (e.g. the same
// endpoint validated across many scenarios) don't recompile every time.
const compiledCache = new Map<string, ValidateFunction>();

export interface SchemaValidationResult {
  valid: boolean;
  errors: string[];
}

function getValidator(schema: object): ValidateFunction {
  const cacheKey = JSON.stringify(schema);
  let validateFn = compiledCache.get(cacheKey);
  if (!validateFn) {
    validateFn = ajv.compile(schema);
    compiledCache.set(cacheKey, validateFn);
  }
  return validateFn;
}

export function validateAgainstSchema(data: unknown, schema: object): SchemaValidationResult {
  const validateFn = getValidator(schema);
  const valid = validateFn(data);
  if (valid) {
    return { valid: true, errors: [] };
  }
  const errors = (validateFn.errors ?? []).map((err) => {
    const location = err.instancePath || '$';
    return `${location}: ${err.message}${err.params ? ` ${JSON.stringify(err.params)}` : ''}`;
  });
  return { valid: false, errors };
}
