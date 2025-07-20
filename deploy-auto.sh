#!/usr/bin/expect -f

set timeout 30
spawn ssh root@138.197.72.196

expect "password:"
send "QubitvBit\r"

expect "# "
send "cd /root/passport-buddy\r"

expect "# "
send "docker-compose -f docker-compose.prod.yml down\r"

expect "# "
send "docker-compose -f docker-compose.prod.yml pull\r"

expect "# "
send "docker-compose -f docker-compose.prod.yml up -d\r"

expect "# "
send "docker-compose -f docker-compose.prod.yml logs --tail=50 backend\r"

expect "# "
send "exit\r"

expect eof