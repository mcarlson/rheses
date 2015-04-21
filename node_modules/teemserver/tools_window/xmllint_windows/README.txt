The version of xmllint for windows, http://code.google.com/p/xmllint, has different behavior than the real xmllint program. I'm aware of two important differences:
  - xmllint for windows sends all output to stdout, including errors. In xmllint, error information is sent to stderr.
  - The error format is different. In the windows version, only a single error can be shown, and the string is output using a single line.


I modified the version of xmllint and created a project called xmllint_windows. The .NET executable is checked in the server directory.
