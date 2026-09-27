#!/usr/bin/env python3
"""Small ADB helper for inspecting a test emulator; never targets physical devices."""
import argparse
import pathlib
import re
import subprocess
import xml.etree.ElementTree as ET

parser = argparse.ArgumentParser()
parser.add_argument('--serial', default='emulator-5554')
parser.add_argument('action', choices=['state', 'tap', 'input', 'back', 'screenshot'])
parser.add_argument('value', nargs='?')
args = parser.parse_args()
if not re.fullmatch(r'emulator-\d+', args.serial):
    parser.error('Only an explicitly selected emulator is supported')

def adb(*parts, binary=False):
    return subprocess.check_output(['adb', '-s', args.serial, *parts], timeout=30, text=not binary)

def nodes():
    adb('shell', 'uiautomator', 'dump', '/sdcard/biovera-test-ui.xml')
    return ET.fromstring(adb('exec-out', 'cat', '/sdcard/biovera-test-ui.xml')).iter('node')

if args.action == 'state':
    for node in nodes():
        a = node.attrib
        if a.get('text') or a.get('content-desc') or a.get('class', '').endswith('EditText'):
            print({k: a.get(k) for k in ['text', 'content-desc', 'class', 'clickable', 'bounds']})
elif args.action == 'tap':
    matches = [n for n in nodes() if args.value in (n.get('text'), n.get('content-desc'))]
    if len(matches) != 1:
        raise SystemExit(f'Expected one exact UI match for {args.value!r}, got {len(matches)}')
    x1, y1, x2, y2 = map(int, re.findall(r'\d+', matches[0].get('bounds')))
    adb('shell', 'input', 'tap', str((x1+x2)//2), str((y1+y2)//2))
elif args.action == 'input':
    if not args.value or not re.fullmatch(r'[A-Za-z0-9 @.!_-]+', args.value):
        parser.error('Use simple test text without shell metacharacters')
    adb('shell', 'input', 'text', args.value.replace(' ', '%s'))
elif args.action == 'back':
    adb('shell', 'input', 'keyevent', '4')
elif args.action == 'screenshot':
    if not args.value:
        parser.error('Provide an output PNG path')
    output = pathlib.Path(args.value).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(adb('exec-out', 'screencap', '-p', binary=True))
    print(output)
