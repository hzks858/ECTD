
import { EctdNode, NodeType, ModuleId, User, EctdApplication } from './types';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Sarah Connor', role: 'ADMIN', avatarInitials: 'SC', color: 'bg-purple-500' },
  { id: 'u2', name: 'Dr. Chen', role: 'RA_SPECIALIST', avatarInitials: 'DC', color: 'bg-blue-500' },
  { id: 'u3', name: 'Mike Ross', role: 'REVIEWER', avatarInitials: 'MR', color: 'bg-green-500' },
];

const ONCOLOGY_TREE: EctdNode[] = [
  {
    id: 'm1',
    title: 'Module 1: Administrative Information',
    type: NodeType.FOLDER,
    moduleId: ModuleId.M1,
    children: [
      {
        id: 'm1-1',
        title: '1.1 Forms',
        type: NodeType.FOLDER,
        children: [
          { 
            id: 'm1-1-1', 
            title: 'Form FDA 1571', 
            type: NodeType.FILE, 
            status: 'final', 
            lastModified: '2023-10-25', 
            version: '1.0', 
            content: 'Application to Market a New Drug... [Form Content]',
            history: [
              { version: '1.0', timestamp: '2023-10-25 14:30', userId: 'u2', userName: 'Dr. Chen', description: 'Finalized for submission', contentSnapshot: 'Application to Market a New Drug... [Form Content - v1.0 Snapshot]' },
              { version: '0.9', timestamp: '2023-10-24 09:15', userId: 'u2', userName: 'Dr. Chen', description: 'Updated sponsor details', contentSnapshot: 'Application to Market a New Drug... [Form Content - v0.9 Draft]' },
              { version: '0.1', timestamp: '2023-10-20 11:00', userId: 'u1', userName: 'Sarah Connor', description: 'Initial draft', contentSnapshot: 'Draft Form FDA 1571...' }
            ]
          },
          { id: 'm1-1-2', title: 'Form FDA 3674', type: NodeType.FILE, status: 'reviewed', lastModified: '2023-10-26', version: '0.9', history: [] }
        ]
      },
      {
        id: 'm1-2',
        title: '1.2 Cover Letter',
        type: NodeType.FILE,
        status: 'draft',
        lastModified: '2023-11-01',
        content: 'Dear Dr. Smith, We are pleased to submit...',
        history: [
           { version: '0.1', timestamp: '2023-11-01 10:00', userId: 'u2', userName: 'Dr. Chen', description: 'Created cover letter draft' }
        ]
      }
    ]
  },
  {
    id: 'm2',
    title: 'Module 2: Common Technical Document Summaries',
    type: NodeType.FOLDER,
    moduleId: ModuleId.M2,
    children: [
      { id: 'm2-1', title: '2.1 Table of Contents', type: NodeType.FILE, status: 'final' },
      { id: 'm2-2', title: '2.2 Introduction', type: NodeType.FILE, status: 'reviewed', content: 'This new drug application proposes the use of...' },
      { 
        id: 'm2-3', 
        title: '2.3 Quality Overall Summary', 
        type: NodeType.FILE, 
        status: 'draft', 
        content: 'The drug substance is a white crystalline powder...',
        version: '0.5',
        history: [
          { version: '0.5', timestamp: '2023-11-05 16:20', userId: 'u2', userName: 'Dr. Chen', description: 'Revised solubility data', contentSnapshot: 'The drug substance is a white crystalline powder... [v0.5 Data]' },
          { version: '0.4', timestamp: '2023-11-04 11:00', userId: 'u3', userName: 'Mike Ross', description: 'Review comments added', contentSnapshot: 'The drug substance is a white powder... [v0.4 Data]' }
        ]
      },
      { id: 'm2-4', title: '2.4 Nonclinical Overview', type: NodeType.FILE, status: 'draft' },
      { 
        id: 'm2-5', 
        title: '2.5 Clinical Overview', 
        type: NodeType.FILE, 
        status: 'error', 
        version: '0.1',
        content: 'Clinical efficacy was demonstrated in 3 pivotal trials...',
        validationResults: [
           { ruleId: 'ICH-M4-E-01', severity: 'error', message: 'Missing cross-reference to Module 5.3.5', timestamp: '2023-11-06 09:00' }
        ]
      }
    ]
  },
  {
    id: 'm3',
    title: 'Module 3: Quality',
    type: NodeType.FOLDER,
    moduleId: ModuleId.M3,
    children: [
      {
        id: 'm3-2-s',
        title: '3.2.S Drug Substance',
        type: NodeType.FOLDER,
        children: [
          { id: 'm3-2-s-1', title: '3.2.S.1 General Information', type: NodeType.FILE, status: 'final' },
          { id: 'm3-2-s-2', title: '3.2.S.2 Manufacture', type: NodeType.FILE, status: 'reviewed' },
          { id: 'm3-2-s-3', title: '3.2.S.3 Characterisation', type: NodeType.FILE, status: 'draft' }
        ]
      },
      {
        id: 'm3-2-p',
        title: '3.2.P Drug Product',
        type: NodeType.FOLDER,
        children: [
          { id: 'm3-2-p-1', title: '3.2.P.1 Description and Composition', type: NodeType.FILE, status: 'final' }
        ]
      }
    ]
  },
  {
    id: 'm4',
    title: 'Module 4: Nonclinical Study Reports',
    type: NodeType.FOLDER,
    moduleId: ModuleId.M4,
    children: [
      { id: 'm4-2', title: '4.2 Study Reports', type: NodeType.FOLDER, children: [] }
    ]
  },
  {
    id: 'm5',
    title: 'Module 5: Clinical Study Reports',
    type: NodeType.FOLDER,
    moduleId: ModuleId.M5,
    children: [
      {
        id: 'm5-3',
        title: '5.3 Clinical Study Reports',
        type: NodeType.FOLDER,
        children: [
          {
            id: 'm5-3-5',
            title: '5.3.5 Reports of Efficacy and Safety Studies',
            type: NodeType.FOLDER,
            children: [
              { id: 'm5-3-5-1', title: 'Study 101: Pivotal Phase 3', type: NodeType.FILE, status: 'reviewed', content: 'A randomized, double-blind, placebo-controlled study to evaluate efficacy...' }
            ]
          }
        ]
      }
    ]
  }
];

// Simplified tree for a new app
const BASIC_TREE: EctdNode[] = [
    { id: 'm1', title: 'Module 1: Administrative Information', type: NodeType.FOLDER, moduleId: ModuleId.M1, children: [] },
    { id: 'm2', title: 'Module 2: Summaries', type: NodeType.FOLDER, moduleId: ModuleId.M2, children: [] },
    { id: 'm3', title: 'Module 3: Quality', type: NodeType.FOLDER, moduleId: ModuleId.M3, children: [] },
    { id: 'm4', title: 'Module 4: Nonclinical', type: NodeType.FOLDER, moduleId: ModuleId.M4, children: [] },
    { id: 'm5', title: 'Module 5: Clinical', type: NodeType.FOLDER, moduleId: ModuleId.M5, children: [] },
];

export const MOCK_APPLICATIONS: EctdApplication[] = [
    {
        id: 'app-1',
        name: 'NDA 2024-001 (Oncology)',
        region: 'US',
        sequenceNumber: '0001',
        status: 'active',
        lastModified: '2023-11-06',
        description: 'New Drug Application for novel oncology compound X-101.',
        rootNodes: ONCOLOGY_TREE
    },
    {
        id: 'app-2',
        name: 'IND 112345 (Cardiology)',
        region: 'EU',
        sequenceNumber: '0005',
        status: 'active',
        lastModified: '2023-10-15',
        description: 'Investigational New Drug application for heart failure treatment.',
        rootNodes: BASIC_TREE
    },
    {
        id: 'app-3',
        name: 'ANDA 000999 (Generic)',
        region: 'US',
        sequenceNumber: '0000',
        status: 'submission_ready',
        lastModified: '2023-09-20',
        description: 'Generic submission for Ibuprofen 200mg.',
        rootNodes: BASIC_TREE
    }
];

export const MOCK_RECENT_ACTIVITIES = [
  { id: 1, action: 'Modified', file: '2.3 Quality Overall Summary', user: 'Dr. Chen', time: '10 mins ago' },
  { id: 2, action: 'Approved', file: '1.2 Cover Letter', user: 'Reg. Manager', time: '1 hour ago' },
  { id: 3, action: 'Uploaded', file: 'Study 101 Report', user: 'Clin. Ops', time: '2 hours ago' },
];
