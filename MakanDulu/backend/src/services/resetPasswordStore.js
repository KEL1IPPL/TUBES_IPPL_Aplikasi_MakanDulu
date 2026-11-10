const resetRequests = new Map();

const getResetRequestKey = (email, role) =>
  `${role}:${email.toLowerCase().trim()}`;

const saveResetRequest = (email, role, request) => {
  resetRequests.set(getResetRequestKey(email, role), request);
};

const getResetRequest = (email, role) =>
  resetRequests.get(getResetRequestKey(email, role));

const deleteResetRequest = (email, role) => {
  resetRequests.delete(getResetRequestKey(email, role));
};

module.exports = {
  getResetRequestKey,
  saveResetRequest,
  getResetRequest,
  deleteResetRequest,
};
