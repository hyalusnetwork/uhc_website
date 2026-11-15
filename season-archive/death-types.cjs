const isAdministrativeDeath=type=>/^(disconnect|disqualif)/i.test(type||'');
const isRecordedDeath=type=>['PVP','PVE','Team Kill'].includes(type)||isAdministrativeDeath(type);
module.exports={isAdministrativeDeath,isRecordedDeath};
