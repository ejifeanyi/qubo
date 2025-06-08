import { createServer } from "./server";
import { emailMonitorService } from "./services/email-momitor-service";
import { sessionManager } from "./session-manager";


const port = process.env.PORT || 5001;
const server = createServer();

server.listen(port, () => {
	console.log(`api running on ${port}`);
});

process.on("SIGTERM", () => {
	console.log("SIGTERM received, cleaning up...");
	sessionManager.cleanup();
	emailMonitorService.stopAllMonitoring();
	process.exit(0);
});

process.on("SIGINT", () => {
	console.log("SIGINT received, cleaning up...");
	sessionManager.cleanup();
	emailMonitorService.stopAllMonitoring();
	process.exit(0);
});

process.on("uncaughtException", (error) => {
	console.error("Uncaught Exception:", error);
	sessionManager.cleanup();
	emailMonitorService.stopAllMonitoring();
	process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
	console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
