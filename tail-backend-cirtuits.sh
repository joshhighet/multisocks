#!/bin/bash
watch -n 5 "curl -s 'http://multisocks.dark:1337/;csv' \
| awk -F ',' '{print \$2 \" - \" \$18}' \
| grep -v 'status\|FRONT\|BACK'"
