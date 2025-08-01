#!/usr/bin/env ruby

# Simple test runner to capture failure details
require 'open3'

puts "Running API tests to capture failure details..."
puts "=" * 50

cmd = "bundle exec rspec spec/requests/api/v1/ --format documentation"
stdout, stderr, status = Open3.capture3(cmd)

puts "STDOUT:"
puts stdout
puts "\nSTDERR:"
puts stderr
puts "\nExit Status: #{status.exitstatus}"
