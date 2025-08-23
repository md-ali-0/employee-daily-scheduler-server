#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Console colors
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m"
};

const toPascalCase = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const toCamelCase = (str) => str.charAt(0).toLowerCase() + str.slice(1);
const toKebabCase = (str) => str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
const toSnakeCase = (str) => str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));
const log = (message, color = colors.reset) => console.log(`${color}${message}${colors.reset}`);
const error = (message) => log(`❌ ${message}`, colors.red);
const success = (message) => log(`✅ ${message}`, colors.green);
const info = (message) => log(`ℹ️  ${message}`, colors.blue);
const warning = (message) => log(`⚠️  ${message}`, colors.yellow);

class ModuleConfig {
  constructor() {
    this.name = "";
    this.description = "";
    this.fields = [];
    this.hasSoftDelete = false;
    this.hasAuditLogs = false;
    this.hasRelations = false;
    this.relations = [];
    this.generateTests = false;
    this.generateDocs = false;
  }
}

class FieldConfig {
  constructor(name, type, required = false, unique = false, description = "") {
    this.name = name;
    this.type = type;
    this.required = required;
    this.unique = unique;
    this.description = description;
  }
}

class ModuleGenerator {
  constructor() {
    this.config = new ModuleConfig();
  }

  async start() {
    try {
      log("🚀 Welcome to the Mongoose Module Generator!", colors.bright + colors.cyan);
      await this.collectModuleInfo();
      await this.collectFields();
      await this.collectOptions();
      await this.generateModule();
      await this.showNextSteps();
      success("Module generation completed successfully!");
    } catch (err) {
      error(`Generation failed: ${err.message}`);
      process.exit(1);
    } finally {
      rl.close();
    }
  }

  async collectModuleInfo() {
    log("\n📝 Module Information", colors.bright + colors.blue);
    this.config.name = await question("Enter module name (e.g., product, user-profile): ");
    if (!this.config.name) throw new Error("Module name is required");
    this.config.description = await question("Enter module description: ");
    log(`\nModule: ${this.config.name}`, colors.green);
    log(`Description: ${this.config.description}`, colors.cyan);
  }

  async collectFields() {
    log("\n🏗️  Module Fields", colors.bright + colors.blue);
    log("Let's define the fields for your module. Type 'done' when finished.\n", colors.cyan);

    const fieldTypes = [
      "String", "Number", "Boolean", "Date", "ObjectId", "Array", "Mixed"
    ];

    while (true) {
      const fieldName = await question("Field name (or 'done' to finish): ");
      if (fieldName.toLowerCase() === 'done') break;
      const fieldType = await question(`Field type (${fieldTypes.join(", ")}): `);
      const required = (await question("Required? (y/N): ")).toLowerCase() === 'y';
      const unique = (await question("Unique? (y/N): ")).toLowerCase() === 'y';
      const description = await question("Field description: ");
      this.config.fields.push(new FieldConfig(
        fieldName,
        fieldType,
        required,
        unique,
        description
      ));
      success(`Added field: ${fieldName} (${fieldType})`);
    }

    // Add common fields
    this.config.fields.push(new FieldConfig("createdAt", "Date", false, false, "Creation timestamp"));
    this.config.fields.push(new FieldConfig("updatedAt", "Date", false, false, "Last update timestamp"));
    if (this.config.hasSoftDelete) {
      this.config.fields.push(new FieldConfig("deletedAt", "Date", false, false, "Soft delete timestamp"));
    }
  }

  async collectOptions() {
    log("\n⚙️  Module Options", colors.bright + colors.blue);
    this.config.hasSoftDelete = (await question("Enable soft delete? (y/N): ")).toLowerCase() === 'y';
    this.config.hasAuditLogs = (await question("Enable audit logs? (y/N): ")).toLowerCase() === 'y';
    this.config.generateTests = (await question("Generate test files? (y/N): ")).toLowerCase() === 'y';
    this.config.generateDocs = (await question("Generate documentation? (y/N): ")).toLowerCase() === 'y';
  }

  async generateModule() {
    const moduleName = this.config.name;
    const pascalCaseName = toPascalCase(moduleName);
    const camelCaseName = toCamelCase(moduleName);

    const modulePath = path.join(__dirname, "../src/modules", camelCaseName);
    if (fs.existsSync(modulePath)) {
      const overwrite = (await question(`Module '${camelCaseName}' already exists. Overwrite? (y/N): `)).toLowerCase() === 'y';
      if (!overwrite) throw new Error("Module generation cancelled");
      fs.rmSync(modulePath, { recursive: true, force: true });
    }
    fs.mkdirSync(modulePath, { recursive: true });

    log(`\n📁 Generating module: ${pascalCaseName}`, colors.bright + colors.green);

    await this.generateModel(camelCaseName, pascalCaseName, modulePath);
    await this.generateService(camelCaseName, pascalCaseName, modulePath);
    await this.generateController(camelCaseName, pascalCaseName, modulePath);
    await this.generateValidation(camelCaseName, pascalCaseName, modulePath);

    success(`Module generated at: ${modulePath}`);
  }

  async generateModel(camelCaseName, pascalCaseName, modulePath) {
    let fields = "";
    this.config.fields.forEach(field => {
      let type = field.type;
      if (type === "ObjectId") type = "Schema.Types.ObjectId";
      if (type === "Array") type = "[Schema.Types.Mixed]";
      if (type === "Mixed") type = "Schema.Types.Mixed";
      fields += `  ${field.name}: { type: ${type},${field.required ? " required: true," : ""}${field.unique ? " unique: true," : ""} },\n`;
    });

    const template = `import mongoose, { Schema, Document } from "mongoose";

export interface I${pascalCaseName} extends Document {
${this.config.fields.map(f => `  ${f.name}: any; // ${f.description}`).join("\n")}
}

const ${pascalCaseName}Schema = new Schema<I${pascalCaseName}>({
${fields}
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
${this.config.hasSoftDelete ? "  deletedAt: { type: Date, default: null }," : ""}
});

export const ${pascalCaseName}Model = mongoose.model<I${pascalCaseName}>("${pascalCaseName}", ${pascalCaseName}Schema);
`;

    fs.writeFileSync(path.join(modulePath, `${camelCaseName}.model.ts`), template);
    log(`  📄 Model: ${camelCaseName}.model.ts`, colors.green);
  }

  async generateService(camelCaseName, pascalCaseName, modulePath) {
    const template = `import { BaseService } from "@core/base.service";
import { ${pascalCaseName}Model } from "./${camelCaseName}.model";

export class ${pascalCaseName}Service extends BaseService<any> {
  constructor() {
    super(${pascalCaseName}Model);
  }

  // Add custom service methods here
}
`;
    fs.writeFileSync(path.join(modulePath, `${camelCaseName}.service.ts`), template);
    log(`  📄 Service: ${camelCaseName}.service.ts`, colors.green);
  }

  async generateController(camelCaseName, pascalCaseName, modulePath) {
    const template = `import { BaseController } from "@core/base.controller";
import { ${pascalCaseName}Service } from "./${camelCaseName}.service";
import { successResponse } from "@core/response.util";
import { HTTP_STATUS } from "@config/constants";

export class ${pascalCaseName}Controller extends BaseController<any> {
  private ${camelCaseName}Service: ${pascalCaseName}Service;

  constructor() {
    const ${camelCaseName}Service = new ${pascalCaseName}Service();
    super(${camelCaseName}Service);
    this.${camelCaseName}Service = ${camelCaseName}Service;
  }

  // Add custom controller methods here
}
`;
    fs.writeFileSync(path.join(modulePath, `${camelCaseName}.controller.ts`), template);
    log(`  📄 Controller: ${camelCaseName}.controller.ts`, colors.green);
  }

  async generateValidation(camelCaseName, pascalCaseName, modulePath) {
    const template = `// Add your validation schemas here using zod or joi
// Example:
// import { z } from "zod";
// export const create${pascalCaseName}Schema = z.object({ /* ... */ });
`;
    fs.writeFileSync(path.join(modulePath, `${camelCaseName}.validation.ts`), template);
    log(`  📄 Validation: ${camelCaseName}.validation.ts`, colors.green);
  }

  async showNextSteps() {
    log("\nNext steps:", colors.bright + colors.cyan);
    log("- Implement your business logic in the service and controller files.", colors.cyan);
    log("- Add validation schemas as needed.", colors.cyan);
    log("- Register your new module in the app.", colors.cyan);
  }
}

new ModuleGenerator().start();