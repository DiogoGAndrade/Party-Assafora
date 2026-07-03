#!/usr/bin/env node
const audit = require('../server/lib/audit');

const report = audit.runAudit();
console.log(audit.renderTextReport(report));
process.exit(report.ok ? 0 : 1);
