import { createCallerFactory, createTRPCRouter } from "./trpc";
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
import { tenantRouter } from "./routers/tenant";
import { uploadRouter } from "./routers/upload";
import { userRouter } from "./routers/user";
import { vesselRouter } from "./routers/vessel";
import { violationRouter } from "./routers/violation";

export const appRouter = createTRPCRouter({
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
  tenant: tenantRouter,
  upload: uploadRouter,
  user: userRouter,
  vessel: vesselRouter,
  violation: violationRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
