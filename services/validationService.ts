
import { EctdNode, ValidationResult, ModuleId } from '../types';

export const validateEctdNode = (node: EctdNode): ValidationResult[] => {
  const results: ValidationResult[] = [];
  const now = new Date().toLocaleString();

  // Rule 1: ICH Naming Convention (Simplified)
  const namingRegex = /^[a-zA-Z0-9\s\-\.\(\)\:]+$/;
  if (!namingRegex.test(node.title)) {
    results.push({
      ruleId: 'ICH-FILE-001',
      severity: 'error',
      message: 'Filename contains invalid characters. Use only alphanumeric, spaces, hyphens, and dots.',
      timestamp: now
    });
  }

  // Rule 2: Metadata Check - Version
  if (node.type === 'FILE' && !node.version) {
    results.push({
      ruleId: 'ICH-META-001',
      severity: 'warning',
      message: 'Version metadata is missing. Defaulting to 0.1 for internal tracking.',
      timestamp: now
    });
  }

  // Rule 3: Content Presence
  if (node.type === 'FILE' && (!node.content || node.content.length < 10)) {
    results.push({
      ruleId: 'ICH-CONT-001',
      severity: 'warning',
      message: 'Document content appears to be empty or too short.',
      timestamp: now
    });
  }

  // Rule 4: Folder Structure
  if (node.type === 'FOLDER' && (!node.children || node.children.length === 0)) {
    results.push({
      ruleId: 'ICH-STRUC-001',
      severity: 'info',
      message: 'Empty folder detected. Verify if this section is applicable for this submission.',
      timestamp: now
    });
  }

  // Rule 5: Status Consistency
  if (node.status === 'final' && (!node.history || node.history.length === 0)) {
    results.push({
      ruleId: 'SYS-AUDIT-001',
      severity: 'error',
      message: 'Document marked as Final but lacks version history trail.',
      timestamp: now
    });
  }

  // Rule 6: Logical Path Validation (NMPA length check)
  if (node.type === 'FILE') {
    if (!node.logicalPath) {
      results.push({
        ruleId: 'ICH-PATH-001',
        severity: 'warning',
        message: 'Logical Path is missing.',
        timestamp: now
      });
    } else {
        if (!/^m[1-5]\/|util\//.test(node.logicalPath)) {
            results.push({
                ruleId: 'ICH-PATH-002',
                severity: 'warning',
                message: 'Logical Path does not follow standard eCTD structure (e.g., "m1/us/...").',
                timestamp: now
            });
        }
        // NMPA V1.1: Max path length 180 chars
        if (node.logicalPath.length > 180) {
            results.push({
                ruleId: 'NMPA-PATH-003',
                severity: 'error',
                message: 'Logical path exceeds 180 characters limit (NMPA V1.1 Requirement).',
                timestamp: now
            });
        }
    }
  }

  // Rule 7: Regional XML Backbone Presence
  if (node.type === 'FOLDER' && (node.moduleId === 'm1' || node.title.includes('Module 1'))) {
    const hasRegionalXml = hasXmlDescendant(node);
    if (!hasRegionalXml) {
      results.push({
        ruleId: 'ICH-XML-001',
        severity: 'error',
        message: 'Regional XML backbone (e.g., us-regional.xml, cn-regional.xml) is missing in Module 1.',
        timestamp: now
      });
    }
  }
  
  // Rule 8: NMPA V1.1 Util Folder Integrity Check
  // Verifies that DTD and XSL files match official NMPA checksums
  if (node.type === 'FILE' && node.logicalPath?.startsWith('util/')) {
      const fileName = node.title;
      // Official MD5 hashes for NMPA V1.1 package files (Mock values for simulation)
      const OFFICIAL_NMPA_CHECKSUMS: Record<string, string> = {
          'ich-ectd-3-2.dtd': 'd41d8cd98f00b204e9800998ecf8427e', 
          'cn-regional.xsd': 'a1b2c3d4e5f67890a1b2c3d4e5f67890',
          'ectd-2-0.xsl': 'b2c3d4e5f67890a1b2c3d4e5f67890a1' 
      };

      if (fileName in OFFICIAL_NMPA_CHECKSUMS) {
          const expected = OFFICIAL_NMPA_CHECKSUMS[fileName];
          // Ensure file hasn't been tampered with
          if (node.checksum && node.checksum !== expected) {
               results.push({
                  ruleId: 'NMPA-UTIL-MD5',
                  severity: 'error',
                  message: `Critical Error: The system file '${fileName}' in 'util' folder has invalid checksum. Must match NMPA V1.1 official package.`,
                  timestamp: now
              });
          }
      }
  }

  // Rule 9: NMPA V1.1 Node Extension Check (3.2.R only)
  // Check if current node is a Node Extension (implied by title/type in this mock)
  if (node.type === 'FOLDER' && node.title.includes('Node Extension')) {
      // Assuming parent logic is handled in the UI, but validating here:
      if (!node.logicalPath?.includes('32-body-data') && !node.logicalPath?.includes('32r-reg-info')) {
           results.push({
              ruleId: 'NMPA-NODE-EXT-001',
              severity: 'error',
              message: 'Node Extensions are only permitted in 3.2.R (NMPA V1.1 Validation Criteria 3.16).',
              timestamp: now
          });
      }
  }

  return results;
};

// Helper to check recursively for any XML file in the subtree
const hasXmlDescendant = (node: EctdNode): boolean => {
  if (node.type === 'FILE' && node.title.toLowerCase().endsWith('.xml')) {
    return true;
  }
  if (node.children) {
    return node.children.some(child => hasXmlDescendant(child));
  }
  return false;
};
