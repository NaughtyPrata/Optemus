import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to recursively find all CSS files
function findCssFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            findCssFiles(filePath, fileList);
        } else if (file.endsWith('.css')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

// Function to analyze CSS files for !important declarations
function analyzeCssFiles(files) {
    const results = {
        fileStats: {},
        totalImportant: 0,
        selectors: {},
        properties: {},
        importantDeclarations: []
    };
    
    files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const fileName = path.basename(file);
        const importantCount = (content.match(/!important/g) || []).length;
        
        // Skip files with no !important declarations
        if (importantCount === 0) {
            results.fileStats[fileName] = { count: 0, declarations: [] };
            return;
        }
        
        results.totalImportant += importantCount;
        results.fileStats[fileName] = { count: importantCount, declarations: [] };
        
        // Simple regex to extract selectors and properties with !important
        // Note: This is a simplified approach and might not catch all edge cases
        const regex = /([^{]+)\{[^}]*?([^;]+?)\s*!important/g;
        const simplePropertyRegex = /\s*([^:]+):\s*([^!]+)!important/g;
        
        let match;
        while ((match = simplePropertyRegex.exec(content)) !== null) {
            const property = match[1].trim();
            const value = match[2].trim();
            
            // Count property occurrences
            results.properties[property] = (results.properties[property] || 0) + 1;
            
            // Add to declarations
            results.importantDeclarations.push({
                file: fileName,
                property,
                value
            });
        }
        
        // More complex regex to get selector and property pairs
        const declarationRegex = /([^{]+)\{([^}]+)\}/g;
        let declarationMatch;
        
        while ((declarationMatch = declarationRegex.exec(content)) !== null) {
            const selector = declarationMatch[1].trim();
            const declarations = declarationMatch[2];
            
            const importantProps = [];
            let propMatch;
            const propRegex = /([^:]+):\s*([^;!]+)\s*!important/g;
            
            while ((propMatch = propRegex.exec(declarations)) !== null) {
                const prop = propMatch[1].trim();
                const value = propMatch[2].trim();
                
                importantProps.push({ property: prop, value });
                
                // Count selector occurrences
                results.selectors[selector] = (results.selectors[selector] || 0) + 1;
            }
            
            if (importantProps.length > 0) {
                results.fileStats[fileName].declarations.push({
                    selector,
                    properties: importantProps
                });
            }
        }
    });
    
    return results;
}

// Function to generate migration plan
function generateMigrationPlan(analysis) {
    const plan = {
        itcssStructure: {
            settings: [],
            tools: [],
            generic: [],
            elements: [],
            objects: [],
            components: [],
            utilities: []
        },
        filesRecommendations: {},
        selectorMigrations: {}
    };
    
    // Categorize selectors into ITCSS layers
    Object.keys(analysis.selectors).forEach(selector => {
        // Simple heuristic for categorization
        if (selector.startsWith('.') && (selector.includes('__') || selector.includes('--'))) {
            // BEM-like selectors are likely components
            plan.itcssStructure.components.push(selector);
            plan.selectorMigrations[selector] = '5-components';
        } else if (selector.startsWith('.') && selector.includes('-')) {
            // Utility classes often have hyphens
            plan.itcssStructure.utilities.push(selector);
            plan.selectorMigrations[selector] = '6-utilities';
        } else if (selector.match(/^[a-z]+$/)) {
            // Single element selectors
            plan.itcssStructure.elements.push(selector);
            plan.selectorMigrations[selector] = '3-elements';
        } else if (selector.startsWith('.o-') || selector.includes('grid') || selector.includes('layout')) {
            // Object/layout patterns
            plan.itcssStructure.objects.push(selector);
            plan.selectorMigrations[selector] = '4-objects';
        } else if (selector.includes('*') || selector.includes('html') || selector.includes('body')) {
            // Generic resets
            plan.itcssStructure.generic.push(selector);
            plan.selectorMigrations[selector] = '2-generic';
        } else if (selector.startsWith('.')) {
            // Default for class selectors
            plan.itcssStructure.components.push(selector);
            plan.selectorMigrations[selector] = '5-components';
        } else {
            // Default for anything else
            plan.itcssStructure.elements.push(selector);
            plan.selectorMigrations[selector] = '3-elements';
        }
    });
    
    // Generate file recommendations
    Object.keys(analysis.fileStats).forEach(file => {
        if (file.includes('fix') || file.includes('override')) {
            plan.filesRecommendations[file] = 'Migrate to appropriate ITCSS layers and remove';
        } else if (file.includes('reset') || file.includes('normalize')) {
            plan.filesRecommendations[file] = 'Move to 2-generic';
        } else if (file.includes('variable') || file.includes('theme')) {
            plan.filesRecommendations[file] = 'Move to 1-settings';
        } else if (file.includes('util') || file.includes('helper')) {
            plan.filesRecommendations[file] = 'Move to 6-utilities';
        } else if (file.includes('layout') || file.includes('grid')) {
            plan.filesRecommendations[file] = 'Move to 4-objects';
        } else {
            plan.filesRecommendations[file] = 'Analyze content and distribute to appropriate layers';
        }
    });
    
    return plan;
}

// Main analysis function
async function main() {
    const cssDir = path.join(__dirname, 'public', 'css');
    const outputFile = path.join(__dirname, 'css-analysis-results.json');
    const migrationPlanFile = path.join(__dirname, 'css-migration-plan.json');
    
    console.log('Finding CSS files...');
    const cssFiles = findCssFiles(cssDir);
    console.log(`Found ${cssFiles.length} CSS files.`);
    
    console.log('Analyzing CSS files for !important declarations...');
    const analysis = analyzeCssFiles(cssFiles);
    console.log(`Found ${analysis.totalImportant} !important declarations in ${Object.keys(analysis.fileStats).length} files.`);
    
    // Calculate files with most !important declarations
    const topFiles = Object.entries(analysis.fileStats)
        .filter(([_, stats]) => stats.count > 0)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10);
    
    console.log('\nTop files with !important declarations:');
    topFiles.forEach(([file, stats]) => {
        console.log(`${file}: ${stats.count} declarations`);
    });
    
    // Calculate most common properties with !important
    const topProperties = Object.entries(analysis.properties)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    console.log('\nMost common properties with !important:');
    topProperties.forEach(([prop, count]) => {
        console.log(`${prop}: ${count} occurrences`);
    });
    
    // Generate migration plan
    console.log('\nGenerating migration plan...');
    const migrationPlan = generateMigrationPlan(analysis);
    
    // Write results to files
    fs.writeFileSync(outputFile, JSON.stringify(analysis, null, 2));
    fs.writeFileSync(migrationPlanFile, JSON.stringify(migrationPlan, null, 2));
    
    console.log(`\nAnalysis complete. Results written to ${outputFile}`);
    console.log(`Migration plan written to ${migrationPlanFile}`);
    
    return { analysis, migrationPlan };
}

// Run the analysis
main().catch(err => {
    console.error('Error during analysis:', err);
});
