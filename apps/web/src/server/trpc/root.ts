import { createCallerFactory, createTRPCRouter } from "./trpc";
import { analyticsRouter } from "./routers/analytics";
import { auditLogRouter } from "./routers/auditLog";
import { importRouter } from "./routers/import";
import { ayudaRouter } from "./routers/ayuda";
import { categoryRouter } from "./routers/category";
import { commentRouter } from "./routers/comment";
import { dashboardRouter } from "./routers/dashboard";
import { editRequestRouter } from "./routers/editRequest";
import { fisherfolkRouter } from "./routers/fisherfolk";
import { idTemplateRouter } from "./routers/idTemplate";
import { kanbanTaskRouter } from "./routers/kanbanTask";
import { notificationRouter } from "./routers/notification";
import { reportRouter } from "./routers/report";
import { tenantRouter } from "./routers/tenant";
import { uploadRouter } from "./routers/upload";
import { userRouter } from "./routers/user";
import { settingsRouter } from "./routers/settings";
import { vesselRouter } from "./routers/vessel";
import { violationRouter } from "./routers/violation";

export const appRouter = createTRPCRouter({
  analytics: analyticsRouter,
  auditLog: auditLogRouter,
  ayuda: ayudaRouter,
  category: categoryRouter,
  comment: commentRouter,
  dashboard: dashboardRouter,
  editRequest: editRequestRouter,
  fisherfolk: fisherfolkRouter,
  import: importRouter,
  idTemplate: idTemplateRouter,
  kanbanTask: kanbanTaskRouter,
  notification: notificationRouter,
  report: reportRouter,
  settings: settingsRouter,
  tenant: tenantRouter,
  upload: uploadRouter,
  user: userRouter,
  vessel: vesselRouter,
  violation: violationRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
