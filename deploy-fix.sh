#!/usr/bin/expect -f

set timeout 60
spawn ssh root@138.197.72.196

expect "password:"
send "QubitvBit\r"

expect "# "
send "cd /root\r"

expect "# "
send "# First, find what's using port 8080\r"
send "lsof -i :8080 || netstat -tulpn | grep :8080\r"

expect "# "
send "# Kill the process using port 8080 if needed\r"
send "kill -9 \$(lsof -t -i:8080) 2>/dev/null || true\r"

expect "# "
send "# Check if passport-buddy directory exists\r"
send "ls -la | grep passport\r"

expect "# "
send "# Find the correct docker-compose file\r"
send "find /root -name 'docker-compose.prod.yml' -type f\r"

expect "# "
send "# Let's check what's in the root directory\r"
send "ls -la\r"

expect "# "
send "exit\r"

expect eof