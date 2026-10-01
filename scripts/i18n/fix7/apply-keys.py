"""Insert dotted keys into <dir>/<lang>.json (overwrites value if present). Usage: apply-keys.py keys.json dir"""
import json,collections,sys
keys=json.load(open(sys.argv[1])); d0=sys.argv[2]
for lang in ['en','sr','de','es','fr','ro','bg']:
    p=f'{d0}/{lang}.json'
    d=json.load(open(p),object_pairs_hook=collections.OrderedDict)
    for k,v in keys.items():
        parts=k.split('.'); cur=d
        for x in parts[:-1]:
            if isinstance(cur,list): cur=cur[int(x)]; continue
            if x not in cur or not isinstance(cur[x],(dict,list)): cur[x]=collections.OrderedDict()
            cur=cur[x]
        last=parts[-1]
        if isinstance(cur,list): cur[int(last)]=v[lang]
        else: cur[last]=v[lang]
    open(p,'w').write(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
print('ok',len(keys))
