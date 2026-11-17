// Ships structured logs to the central log platform, retained for 400 days.
module.exports = {
  info: (message, fields) => console.log(JSON.stringify({ level: "info", message, ...fields })),
};
