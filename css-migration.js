import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to ensure directory exists
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dirPath}`);
    }
}

// Function to read and parse the analysis and migration plan
function loadAnalysisData() {
    const analysisPath = path.join(__dirname, 'css-analysis-results.json');
    const planPath = path.join(__dirname, 'css-migration-plan.json');
    
    if (!fs.existsSync(analysisPath) || !fs.existsSync(planPath)) {
        console.error('Analysis files not found. Run css-analysis.js first.');
        process.exit(1);
    }
    
    return {
        analysis: JSON.parse(fs.readFileSync(analysisPath, 'utf8')),
        plan: JSON.parse(fs.readFileSync(planPath, 'utf8'))
    };
}

// Function to create ITCSS structure if it doesn't exist
function setupItcssStructure() {
    const cssDir = path.join(__dirname, 'public', 'css');
    
    // Define ITCSS layers
    const layers = [
        { name: '1-settings', description: 'Variables, config' },
        { name: '2-tools', description: 'Mixins, functions' },
        { name: '3-generic', description: 'Reset, normalize' },
        { name: '4-elements', description: 'Bare HTML elements' },
        { name: '5-objects', description: 'Layout, structure' },
        { name: '6-components', description: 'UI components' },
        { name: '7-utilities', description: 'Helpers, overrides' }
    ];
    
    // Create each layer directory and README
    layers.forEach(layer => {
        const layerDir = path.join(cssDir, layer.name);
        ensureDirectoryExists(layerDir);
        
        // Create README for the layer
        const readmePath = path.join(layerDir, 'README.md');
        if (!fs.existsSync(readmePath)) {
            fs.writeFileSync(readmePath, `# ${layer.name}\n\n${layer.description}\n`);
        }
    });
    
    console.log('ITCSS directory structure created/verified.');
}

// Function to create a new main.css file that imports all ITCSS layers
function createMainCssImport() {
    const cssDir = path.join(__dirname, 'public', 'css');
    const mainCssPath = path.join(cssDir, 'main.css');
    
    // Create backup of existing main.css if it exists
    if (fs.existsSync(mainCssPath)) {
        const backupPath = path.join(cssDir, 'main.css.bak');
        fs.copyFileSync(mainCssPath, backupPath);
        console.log(`Backed up existing main.css to ${backupPath}`);
    }
    
    // Define the new main.css content with imports
    const mainCssContent = `/**
 * ITCSS Architecture
 * -----------------
 * This file imports all CSS following the Inverted Triangle CSS methodology
 * https://www.xfive.co/blog/itcss-scalable-maintainable-css-architecture/
 */

/* Settings - Variables and configuration */
@import './1-settings/index.css';

/* Tools - Mixins and functions */
@import './2-tools/index.css';

/* Generic - Reset and normalize */
@import './3-generic/index.css';

/* Elements - Bare HTML elements */
@import './4-elements/index.css';

/* Objects - Layout and structure classes */
@import './5-objects/index.css';

/* Components - UI components */
@import './6-components/index.css';

/* Utilities - Helper classes */
@import './7-utilities/index.css';
`;

    // Write the new main.css
    fs.writeFileSync(mainCssPath, mainCssContent);
    console.log('Created new main.css with ITCSS layer imports');
    
    // Create index.css in each layer directory if it doesn't exist
    const layers = ['1-settings', '2-tools', '3-generic', '4-elements', '5-objects', '6-components', '7-utilities'];
    layers.forEach(layer => {
        const indexPath = path.join(cssDir, layer, 'index.css');
        if (!fs.existsSync(indexPath)) {
            fs.writeFileSync(indexPath, `/**\n * ${layer}\n */\n\n/* Import all ${layer} files here */\n`);
            console.log(`Created ${layer}/index.css`);
        }
    });
}

// Function to extract important declarations and create new files
function migrateImportantStyles(analysis, plan) {
    const cssDir = path.join(__dirname, 'public', 'css');
    const migrationLog = [];
    
    // Create object to store CSS by ITCSS layer
    const layerStyles = {
        '1-settings': {},
        '2-tools': {},
        '3-generic': {},
        '4-elements': {},
        '5-objects': {},
        '6-components': {},
        '7-utilities': {}
    };
    
    // Process each file with !important declarations
    Object.entries(analysis.fileStats).forEach(([filename, fileData]) => {
        if (fileData.count === 0) return;
        
        console.log(`Processing file: ${filename}`);
        migrationLog.push(`Processing file: ${filename} (${fileData.count} !important declarations)`);
        
        // Process each declaration block in the file
        fileData.declarations.forEach(decl => {
            const { selector, properties } = decl;
            
            // Determine target layer for this selector
            let targetLayer = '6-components'; // Default to components
            
            // Simple heuristic for categorization
            if (selector.startsWith('.') && selector.includes('__')) {
                targetLayer = '6-components'; // BEM components
            } else if (selector.startsWith('.u-') || selector.match(/^\.([a-z-]+)?([a-z0-9]+)?$/)) {
                targetLayer = '7-utilities'; // Utilities
            } else if (selector.match(/^[a-z]+$/) || selector.match(/^h[1-6]$/)) {
                targetLayer = '4-elements'; // HTML elements
            } else if (selector.startsWith('.o-') || selector.includes('grid') || selector.includes('layout')) {
                targetLayer = '5-objects'; // Layout objects
            } else if (selector.includes('*') || selector.includes('html') || selector.includes('body')) {
                targetLayer = '3-generic'; // Generic styles
            }
            
            // Initialize object for this selector if it doesn't exist
            if (!layerStyles[targetLayer][selector]) {
                layerStyles[targetLayer][selector] = [];
            }
            
            // Add properties for this selector
            properties.forEach(prop => {
                layerStyles[targetLayer][selector].push(`  ${prop.property}: ${prop.value};`);
                migrationLog.push(`  - Migrated: "${selector}" { ${prop.property}: ${prop.value}; } to ${targetLayer}`);
            });
        });
    });
    
    // Create CSS files from the collected styles
    Object.entries(layerStyles).forEach(([layer, selectors]) => {
        if (Object.keys(selectors).length === 0) return;
        
        // Create a file name based on layer
        const layerName = layer.substring(2); // Remove prefix number
        const filePath = path.join(cssDir, layer, `migrated-${layerName}.css`);
        
        let fileContent = `/**\n * Migrated styles for ${layerName}\n * These styles were extracted from files with !important declarations\n */\n\n`;
        
        // Add each selector and its properties
        Object.entries(selectors).forEach(([selector, properties]) => {
            fileContent += `${selector} {\n${properties.join('\n')}\n}\n\n`;
        });
        
        // Write the file
        fs.writeFileSync(filePath, fileContent);
        console.log(`Created ${filePath} with ${Object.keys(selectors).length} selectors`);
        migrationLog.push(`Created ${filePath} with ${Object.keys(selectors).length} selectors`);
        
        // Update the index.css for this layer
        const indexPath = path.join(cssDir, layer, 'index.css');
        let indexContent = fs.readFileSync(indexPath, 'utf8');
        
        // Add import if it doesn't exist
        const importStatement = `@import './migrated-${layerName}.css';`;
        if (!indexContent.includes(importStatement)) {
            indexContent += `\n${importStatement}\n`;
            fs.writeFileSync(indexPath, indexContent);
            console.log(`Updated ${indexPath} with import`);
            migrationLog.push(`Updated ${indexPath} with import`);
        }
    });
    
    // Write migration log
    const logPath = path.join(__dirname, 'css-migration-log.txt');
    fs.writeFileSync(logPath, migrationLog.join('\n'));
    console.log(`Migration log written to ${logPath}`);
}

// Function to create a backup of original CSS files
function backupOriginalCss() {
    const cssDir = path.join(__dirname, 'public', 'css');
    const backupDir = path.join(__dirname, 'public', 'css-backup-' + Date.now());
    
    ensureDirectoryExists(backupDir);
    
    // Copy all CSS files from the css directory to the backup directory
    const files = fs.readdirSync(cssDir);
    files.forEach(file => {
        const filePath = path.join(cssDir, file);
        const stat = fs.statSync(filePath);
        
        if (!stat.isDirectory() && file.endsWith('.css')) {
            const backupPath = path.join(backupDir, file);
            fs.copyFileSync(filePath, backupPath);
        }
    });
    
    console.log(`Backed up original CSS files to ${backupDir}`);
    return backupDir;
}

// Main function to run the migration
async function main() {
    console.log('Starting CSS migration to ITCSS...');
    
    // Load analysis data
    const { analysis, plan } = loadAnalysisData();
    
    // Back up original CSS
    const backupDir = backupOriginalCss();
    
    // Setup ITCSS directory structure
    setupItcssStructure();
    
    // Create main.css with imports
    createMainCssImport();
    
    // Migrate important styles to new structure
    migrateImportantStyles(analysis, plan);
    
    console.log('\nMigration complete!');
    console.log(`Original CSS files backed up to: ${backupDir}`);
    console.log('Next steps:');
    console.log('1. Test the application with the new CSS structure');
    console.log('2. Remove unnecessary original CSS files once you confirm everything works');
    console.log('3. Continue refining the ITCSS structure as needed');
}

// Run the migration
main().catch(err => {
    console.error('Error during migration:', err);
});
