import { createCallerFactory, createTRPCRouter } from "./trpc";
import { analyticsRouter } from "./routers/analytics";
import { auditLogRouter } from "./routers/auditLog";
import { importRouter } from "./routers/import";
import { ayudaRouter } from "./routers/ayuda";
import { categoryRouter } from "./routers/category";
import { commentRouter } from "./routers/comment";
import { customRoleRouter } from "./routers/customRole";
import { dashboardRouter } from "./routers/dashboard";
import { editRequestRouter } from "./routers/editRequest";
import { familyRouter } from "./routers/family";
import { fishCatchRouter } from "./routers/fishCatch";
import { fishCatchAnalyticsRouter } from "./routers/fishCatchAnalytics";
import { fisherfolkRouter } from "./routers/fisherfolk";
import { householdRouter } from "./routers/household";
import { householdNetworkRouter } from "./routers/household-network";
import { idTemplateRouter } from "./routers/idTemplate";
import { idPrintRouter } from "./routers/idPrint";
import { kanbanTaskRouter } from "./routers/kanbanTask";
import { notificationRouter } from "./routers/notification";
import { platformRoleRouter } from "./routers/platformRole";
import { reportRouter } from "./routers/report";
import { tenantRouter } from "./routers/tenant";
import { tenantUserRouter } from "./routers/tenantUser";
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
  customRole: customRoleRouter,
  dashboard: dashboardRouter,
  editRequest: editRequestRouter,
  family: familyRouter,
  fishCatch: fishCatchRouter,
  fishCatchAnalytics: fishCatchAnalyticsRouter,
  fisherfolk: fisherfolkRouter,
  household: householdRouter,
  householdNetwork: householdNetworkRouter,
  import: importRouter,
  idTemplate: idTemplateRouter,
  idPrint: idPrintRouter,
  kanbanTask: kanbanTaskRouter,
  notification: notificationRouter,
  platformRole: platformRoleRouter,
  report: reportRouter,
  settings: settingsRouter,
  tenant: tenantRouter,
  tenantUser: tenantUserRouter,
  upload: uploadRouter,
  user: userRouter,
  vessel: vesselRouter,
  violation: violationRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
