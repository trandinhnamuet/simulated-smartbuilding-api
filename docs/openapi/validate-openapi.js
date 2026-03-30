#!/usr/bin/env node
/**
 * OpenAPI Specification Validator
 * Usage: node validate-openapi.js [path-to-openapi.yaml]
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const filePath = process.argv[2] || path.join(__dirname, 'openapi.yaml');

try {
  console.log(`📋 Validating OpenAPI specification: ${filePath}\n`);

  // Check file exists
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  // Read and parse YAML
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const spec = yaml.load(fileContent);

  // Validate basic structure
  if (!spec.openapi) throw new Error('Missing "openapi" field');
  if (!spec.info) throw new Error('Missing "info" field');
  if (!spec.paths) throw new Error('Missing "paths" field');

  console.log(`✅ OpenAPI Version: ${spec.info.version}`);
  console.log(`✅ Title: ${spec.info.title}\n`);

  // Count endpoints
  let totalEndpoints = 0;
  const pathsByTag = {};

  Object.entries(spec.paths).forEach(([pathName, pathObj]) => {
    Object.keys(pathObj).forEach((method) => {
      if (!['parameters', 'servers'].includes(method)) {
        totalEndpoints++;

        const operation = pathObj[method];
        const tags = operation.tags || ['untagged'];
        tags.forEach((tag) => {
          if (!pathsByTag[tag]) {
            pathsByTag[tag] = [];
          }
          pathsByTag[tag].push({
            method: method.toUpperCase(),
            path: pathName,
            summary: operation.summary || 'No summary',
          });
        });
      }
    });
  });

  console.log(`📊 Statistics:`);
  console.log(`   Total Paths: ${Object.keys(spec.paths).length}`);
  console.log(`   Total Endpoints: ${totalEndpoints}`);
  console.log(`   Total Schemas: ${Object.keys(spec.components?.schemas || {}).length}\n`);

  // Display endpoints by tag
  console.log(`🏷️  Endpoints by Tag:\n`);
  Object.entries(pathsByTag)
    .sort()
    .forEach(([tag, endpoints]) => {
      console.log(`   ${tag.toUpperCase()} (${endpoints.length})`);
      endpoints.forEach(({ method, path, summary }) => {
        const icon =
          method === 'GET'
            ? '📖'
            : method === 'POST'
              ? '✍️ '
              : method === 'PATCH'
                ? '✏️ '
                : method === 'DELETE'
                  ? '🗑️ '
                  : '🔧';
        console.log(
          `      ${icon} ${method.padEnd(6)} ${path.padEnd(50)} ${summary.substring(0, 40)}`,
        );
      });
      console.log();
    });

  // Check for required fields
  console.log(`✨ Validation Checks:`);

  const checks = [
    [spec.servers && spec.servers.length > 0, 'Servers defined'],
    [spec.info.description, 'Has description'],
    [spec.info.contact, 'Has contact info'],
    [spec.info.license, 'Has license'],
    [spec.components?.schemas, 'Has component schemas'],
    [spec.components?.responses, 'Has reusable responses'],
    [spec.tags && spec.tags.length > 0, 'Has tags defined'],
  ];

  checks.forEach(([condition, label]) => {
    console.log(`   ${condition ? '✅' : '⚠️ '} ${label}`);
  });

  console.log(`\n✅ OpenAPI specification is valid!\n`);
  process.exit(0);
} catch (error) {
  console.error(`\n❌ Validation Error: ${error.message}\n`);
  process.exit(1);
}
