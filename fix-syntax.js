const fs = require('fs');
const path = require('path');

// Path to our file
const filePath = path.join('app', 'api', 'start-workspace', 'route.js');

// Read the file content
const content = fs.readFileSync(filePath, 'utf8');

// Find the problematic continue statement and remove all unreachable code
// by finding the next valid section start
const continueStmt = "          continue;";
const continueIndex = content.indexOf(continueStmt, 1200); // Start searching around line 1200

if (continueIndex !== -1) {
  console.log(`Found continue statement at position ${continueIndex}`);
  
  // Find the start of the next action type
  const nextActionStart = content.indexOf("        } else if (action.type ===", continueIndex);
  
  if (nextActionStart !== -1) {
    console.log(`Found next action type at position ${nextActionStart}`);
    
    // Create new content with the unreachable code removed
    const newContent = 
      content.substring(0, continueIndex + continueStmt.length) + 
      "\n" + 
      content.substring(nextActionStart);
    
    // Write the fixed content back to the file
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log("✅ Successfully removed unreachable code after continue statement");
  } else {
    console.error("Could not find next action type after continue statement");
  }
} else {
  console.error("Could not find continue statement around line 1200");
}
