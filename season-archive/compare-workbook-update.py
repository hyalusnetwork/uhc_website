import zipfile,xml.etree.ElementTree as E
ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
def cells(path):
 with zipfile.ZipFile(path) as z:
  shared=[''.join(x.itertext()) for x in E.fromstring(z.read('xl/sharedStrings.xml'))]
  out={}
  for i in range(1,6):
   name=f'xl/worksheets/sheet{i}.xml'
   if name not in z.namelist():continue
   for c in E.fromstring(z.read(name)).findall('.//s:sheetData/s:row/s:c',ns):
    v=c.find('s:v',ns)
    val=v.text if v is not None else ''
    if c.get('t')=='s' and val:val=shared[int(val)]
    if val:out[(i,c.get('r'))]=val
  return out
a=cells('../UHC_Data.xlsx');b=cells(r'C:\Users\logan\Downloads\UHC_Data (5).xlsx')
diff=[(key,a.get(key),b.get(key)) for key in sorted(a.keys()|b.keys()) if a.get(key)!=b.get(key)]
for row in diff:print(row)
print('Changed cells:',len(diff))
