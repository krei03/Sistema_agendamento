function isNonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isTime(value) {
  return /^\d{2}:\d{2}$/.test(value);
}

function validateRequired(body, fields) {
  const missing = fields.filter((field) => !isNonEmpty(body[field]));
  return missing;
}

module.exports = {
  clean,
  isDate,
  isEmail,
  isNonEmpty,
  isTime,
  validateRequired
};
