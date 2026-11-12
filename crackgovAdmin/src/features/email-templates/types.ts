export interface EmailTemplateItem {
  id: number;
  templateKey: string;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string | null;
  dynamicVariables?: string | null;
  franchiseId?: number | null;
  franchiseName?: string | null;
  franchiseCode?: string | null;
  isActive: boolean;
  createdOn?: string;
  modifiedOn?: string | null;
}

export interface EmailTemplatePage {
  totalCount: number;
  page: number;
  pageSize: number;
  items: EmailTemplateItem[];
}

export interface RenderEmailTemplateResponse {
  templateKey: string;
  renderedSubject: string;
  renderedBodyHtml: string;
  renderedBodyText?: string | null;
}
