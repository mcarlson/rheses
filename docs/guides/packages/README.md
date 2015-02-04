# Dreem Class Packages Guide

[//]: # This guide describes how packages work in the class system

### Packages in Dream

You define a new class in dreem using a .dre file. You place the .dre file in the classes directory under dreem root. The name of the file must be the class name with a .dre extension. You can then use the new class as a tag. The tag name is the same as the class name. Eventually you may find that you have a large number of classes and it would be better to organize them by related functionality. In this situation you want to make use of packages.

To make a package, create a subdirectory in the classes directory. The name of the subdirectory is the package name. Place .dre files within that subdirectory to put them in a package.

The class name used within the .dre file must be fully qualified. A fully qualified class name is one that contains the package name(s) and the class name each separated by '-' characters. When using a class as a tag the tagname is the fully qualified class name.

For example, if you have a package named 'foo' and a class named 'bar' the .dre file would be found at classes/foo/bar.dre and the fully qualified name of the class used within the .dre file would be 'foo-bar'.

If you need to programatically create an instance of a class that is within a package you can reference that class as dr.&lt;package_name&gt;.&lt;class_name&gt;. You can also reference the class as dr['&lt;fully_qualified_class_name&gt;'].

If you are using the createChild method to create a class from a package you should use the fully qualified package-class name.
