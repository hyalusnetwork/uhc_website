import csv,json
from pathlib import Path
rows=list(csv.DictReader(open(r'C:\Users\logan\Downloads\damage-20261114-013629-010-a47c9a67.csv',newline='',encoding='utf-8-sig')))
players=[r for r in rows if r['victim_is_player']=='true']
print('players',len(players),'fatal',[(r['victim_name'],round(float(r['recording_elapsed_ms'])/1000),r['death_message']) for r in players if r['fatal']=='true'])
print('last time',max(float(r['recording_elapsed_ms'])/1000 for r in players))
Path('references/season-37-damage-events.json').write_text(json.dumps(players),encoding='utf-8')
