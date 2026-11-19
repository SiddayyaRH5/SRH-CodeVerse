import fs from 'node:fs'
import path from 'node:path'
const root=process.cwd().endsWith('frontend')?process.cwd():path.join(process.cwd(),'frontend')
const checks=[
 ['Trainer course library page exists','src/pages/trainer/TrainerCourses.jsx'],
 ['Trainer assignment manager exists','src/pages/trainer/TrainerAssignments.jsx'],
 ['Trainer batch manager exists','src/pages/trainer/TrainerBatches.jsx'],
 ['Trainer students page exists','src/pages/trainer/Students.jsx'],
 ['Trainer student detail page exists','src/pages/trainer/StudentDetail.jsx'],
 ['Trainer problem manager exists','src/pages/trainer/TrainerProblems.jsx'],
 ['Trainer problem form exists','src/pages/trainer/ProblemForm.jsx'],
 ['Trainer dashboard exists','src/pages/trainer/TrainerDashboard.jsx'],
 ['Trainer course route wired','src/routes/AppRoutes.jsx','/trainer/courses'],
 ['Trainer assignments route wired','src/routes/AppRoutes.jsx','/trainer/assignments'],
 ['Trainer batches route wired','src/routes/AppRoutes.jsx','/trainer/batches'],
 ['Dashboard quick action to assignments','src/pages/trainer/TrainerDashboard.jsx','/trainer/assignments'],
 ['Dashboard quick action to batches','src/pages/trainer/TrainerDashboard.jsx','/trainer/batches'],
 ['Dashboard quick action to courses','src/pages/trainer/TrainerDashboard.jsx','/trainer/courses'],
 ['Course API used for catalog','src/pages/trainer/TrainerCourses.jsx','getCourses()'],
 ['Assignment browser persistence clearly scoped','src/pages/trainer/TrainerAssignments.jsx','localStorage'],
 ['Batch browser persistence clearly scoped','src/pages/trainer/TrainerBatches.jsx','localStorage'],
]
let fail=0
for(const [label,file,needle] of checks){const content=fs.existsSync(path.join(root,file))?fs.readFileSync(path.join(root,file),'utf8'):'';const ok=!!content&&(needle?content.includes(needle):true);console.log(`${ok?'PASS':'FAIL'} ${label}`);if(!ok)fail++}
console.log(`\nStage 5 static verification: ${checks.length-fail}/${checks.length} passed; ${fail} failed.`)
process.exitCode=fail?1:0
