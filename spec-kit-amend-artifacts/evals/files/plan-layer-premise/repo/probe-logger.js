// Prints when the request logger captures the request: the child logger is bound with req at start.
const events = [];
function requestLogger(req) {
  events.push("captured=start");
  return { finish: () => events.push("finish") };
}
const log = requestLogger({ url: "/allow-list?phone=+5215512341234" });
log.finish();
console.log(events.join(" "));
