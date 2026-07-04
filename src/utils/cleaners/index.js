import * as newsletterCleaner from "./newsletterCleaner";
import * as emailCleaner from "./emailCleaner";
import * as articleCleaner from "./articleCleaner";
import * as churchBulletinCleaner from "./churchBulletinCleaner";
import * as governmentNoticeCleaner from "./governmentNoticeCleaner";

export const CLEANERS = {
  newsletter: newsletterCleaner,
  email: emailCleaner,
  article: articleCleaner,
  churchBulletin: churchBulletinCleaner,
  governmentNotice: governmentNoticeCleaner
};
