const fs=require('node:fs'),assert=require('node:assert/strict');
const workflow=fs.readFileSync('../.github/workflows/pages.yml','utf8');
assert(workflow.includes('  deploy:\n    needs: upload')||workflow.includes('  deploy:\r\n    needs: upload'));
const script=workflow.split('          script: |')[1].split('      - name: Deploy to GitHub Pages')[0].split(/\r?\n/).filter(line=>line.trim()).map(line=>line.slice(12)).join('\n');
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const runScript=new AsyncFunction('github','context','core','process','setTimeout',script);
async function check(responses,expectedFailure,expectedCalls){
 let calls=0;
 const github={rest:{actions:{listWorkflowRunArtifacts:async request=>{
  assert.equal(request.run_id,123);assert.equal(request.name,'github-pages');
  return {data:{artifacts:responses[Math.min(calls++,responses.length-1)]}};
 }}}};
 const run=()=>runScript(github,{repo:{owner:'test',repo:'test'},runId:123},{info(){}},{env:{PAGES_ARTIFACT_ID:'456'}},callback=>callback());
 if(expectedFailure)await assert.rejects(run,expectedFailure);else await run();
 assert.equal(calls,expectedCalls);
}
(async()=>{
 const artifact={id:456,name:'github-pages',expired:false};
 await check([[],[],[artifact]],null,3);
 await check([[artifact]],null,1);
 await check([[]],/not visible/,20);
 await check([[{...artifact,expired:true}]],/not visible/,20);
 await check([[artifact,{...artifact,id:457}]],/Multiple Pages artifacts/,1);
 console.log('Passed: deployment waits for its upload job and retries artifact visibility; missing, expired and duplicate artifacts fail clearly.');
})().catch(error=>{console.error(error);process.exitCode=1;});
