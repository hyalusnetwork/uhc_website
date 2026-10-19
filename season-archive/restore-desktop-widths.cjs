const fs=require('node:fs');let css=fs.readFileSync('dist/ore-theme.css','utf8');
const old='html,body{width:100%;max-width:100%;margin-left:0;margin-right:0}\nmain,main>section,.archive,.archive-main,.players-page,.stats-page,.rankings-page,.trivia-page,.about-page,.profile-body,.profile-primary,.profile-sidebar{min-width:0;max-width:100%}';
if(!css.includes(old))throw Error('Mobile width override missing');
css=css.replace(old,'@media(max-width:850px){\n'+old+'\n}');
css=css.replace('.archive{grid-template-columns:210px minmax(0,1fr)}\n.archive-main,.season-info,.profile-primary,.profile-sidebar,.rankings-main,.table-wrap{min-width:0}\n.table-wrap{max-width:100%}', '@media(max-width:1000px){\n.archive-main,.season-info,.profile-primary,.profile-sidebar,.rankings-main,.table-wrap{min-width:0}\n.table-wrap{max-width:100%}\n}');
fs.writeFileSync('dist/ore-theme.css',css);
