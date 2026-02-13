
export enum NodeType {
  FOLDER = 'FOLDER',
  FILE = 'FILE',
  ROOT = 'ROOT'
}

export enum ModuleId {
  M1 = 'm1',
  M2 = 'm2',
  M3 = 'm3',
  M4 = 'm4',
  M5 = 'm5'
}

export type UserRole = 'ADMIN' | 'RA_SPECIALIST' | 'REVIEWER';

export enum LifecycleOperation {
  NEW = 'new',
  REPLACE = 'replace',
  APPEND = 'append',
  DELETE = 'delete'
}

export type SubmissionType = 'original' | 'supplement' | 'amendment' | 'variation' | 'withdrawal' | 'annual-report';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatarInitials: string;
  color: string;
}

export interface Version {
  version: string;
  timestamp: string;
  userId: string;
  userName: string;
  description: string;
  contentSnapshot?: string; // In a real app, this might be a diff or link to blob
}

export interface ValidationResult {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
}

export interface EctdMetadata {
  manufacturer?: string;
  substance?: string;
  dosageForm?: string;
  indication?: string;
  productName?: string;
  // STF Fields
  studyId?: string;
  studyTitle?: string;
  isStf?: string; // "true" or undefined
  fileTag?: string; // For files inside STF
  [key: string]: string | undefined;
}

export interface EctdNode {
  id: string; // Internal ID
  uuid?: string; // NMPA/ICH UUID for file tracking
  title: string;
  type: NodeType;
  moduleId?: ModuleId;
  children?: EctdNode[];
  status?: 'draft' | 'reviewed' | 'final' | 'error';
  content?: string; 
  lastModified?: string;
  version?: string;
  history?: Version[];
  validationResults?: ValidationResult[];
  
  // LCM & Backbone Fields
  operation?: LifecycleOperation;
  checksum?: string; // MD5
  checksumType?: 'md5';
  metadata?: EctdMetadata;
  logicalPath?: string; // e.g., m1/us/11-forms/form-1571.pdf
  modifiedFileUuid?: string; // For Replace/Delete operations, points to previous UUID
}

export interface EctdSequence {
  sequenceNumber: string;
  submissionType: SubmissionType;
  status: 'draft' | 'published' | 'archived';
  submissionDate: string;
  relatedSequence?: string; // e.g., response relates to 0000
}

export interface EctdApplication {
  id: string;
  name: string;
  region: 'US' | 'EU' | 'CA' | 'JP' | 'CN';
  sequenceNumber: string; // Current working sequence
  submissionType?: SubmissionType; // Type of current sequence
  status: 'active' | 'archived' | 'submission_ready';
  lastModified: string;
  rootNodes: EctdNode[];
  description: string;
  sequenceHistory?: EctdSequence[]; // Track history 0000, 0001, etc.
}

export interface Breadcrumb {
  id: string;
  title: string;
}

export interface AiChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export enum AppView {
  APPLICATIONS = 'APPLICATIONS',
  DASHBOARD = 'DASHBOARD',
  BROWSER = 'BROWSER',
  SETTINGS = 'SETTINGS'
}
