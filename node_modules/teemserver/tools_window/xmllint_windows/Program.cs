// xmllint for Windows. This is based upon the open-source package xmllint.
// I adapted this file from Program.cs (see https://code.google.com/p/xmllint/source/browse/trunk/Program.cs).
// The problem with the original version is that errors are sent to stdout instead of stderr.


using System;
using System.Collections.Generic;
//using System.Linq;
using System.Text;
//using System.Threading.Tasks;
using System.Xml;
using System.Xml.Schema;
using System.IO; 

namespace xmllint_windows
{

    class Program
    {


        // Scan the xml lines and replace dreem code add CDATA structures.
        // This is a total HACK to wrap dreem code fragments.
        static string[] xform_xml(string[] input)
        {
            string[] xml = (string[]) input.Clone();

            string[] tags = new string[] { "handler", "method", "setter", "script" };

            string cdata_start = "<![CDATA[";
            string cdata_end = "]]>";

            // Look start_tag by start_tag for matches
            foreach (string tag in tags)
            {
                string start_tag = '<' + tag;
                string end_tag = "</" + tag + ">";
                string current_tag = null;
                
                for (int index=0; index < xml.Length; index++)
                {
                    string line = xml[index];

                    if (current_tag != null) 
                    {
                        // Look for ending tag
                        int p0 = line.IndexOf (end_tag);
                        if (p0 < 0)
                            continue;

                        line = line.Substring(0,p0) + cdata_end + line.Substring(p0);
                        xml[index] = line;
                        current_tag = null;
                    }
                    else
                    {
                        // Look for starting tag
                        int p0 = line.IndexOf (start_tag);
                        if (p0 < 0)
                            continue;

                        // Ignore stand-alone tags
                        int p1 = line.IndexOf("/>", p0 + start_tag.Length);
                        if (p1 >= 0)
                        {
                            // Stand-alone tag. Skip this
                            continue;
                        }

                        // Find end of tag
                        p1 = line.IndexOf (">", p0+start_tag.Length);
                        if (p1 < 0)
                            continue; // The end isn't found. Skip it

                        line = line.Substring (0, p1+1) + cdata_start + line.Substring(p1+1);
                        xml[index] = line;
                        current_tag = tag;

                        // See if the end tag is also on this line
                        p0 = line.IndexOf (end_tag, p1);
                        if (p0 >= 0)
                        {
                            // The end tag is on the same line as the start tag.
                            line = line.Substring(0, p0) + cdata_end + line.Substring(p0);
                            xml[index] = line;
                            current_tag = null;
                        }

                        // See if the end tag is also on this line. If so, ignore it
                        //TODO Don't ignore it. There may still be informat
                    }
                }
            }

            return xml;
        }



        static void Main(string[] args)
        {
            if (args.Length != 1)
            {
                Console.WriteLine("Usage: xmllint <filename>");
                return;
            }

            try
            {
                String filepath = args[0];
                //String filepath = "f:/clients/teem/git/teem2/dreem/classes/slider.dre";

                // Read the file into an array of strings. We need to modify the input source to prevent parsing errors caused by code fragments
                string[] lines = System.IO.File.ReadAllLines(filepath);

                // Add cdata structures
                lines = xform_xml(lines);

                string fragment = String.Join("\n", lines);
                XmlReaderSettings settings = new XmlReaderSettings();
                settings.ValidationType = ValidationType.None;

                using (XmlReader reader = XmlReader.Create(new StringReader(fragment)))
                {
                    try
                    {
                        while (reader.Read()) ;
                    }
                    catch (XmlException e)
                    {
                        TextWriter stderr = Console.Error;

                        stderr.WriteLine(e.Message);
                        //stderr.WriteLine("Exception object Line, pos: (" + e.LineNumber + "," + e.LinePosition + ")");
                        //stderr.WriteLine("XmlReader Line, pos: (" + tr.LineNumber + "," + tr.LinePosition + ")");
                    }

                }

            }
            catch (Exception ex)
            {
                TextWriter stderr = Console.Error;
                stderr.WriteLine("Unexpected exception: " + ex.Message);
            }
        }

    }

}
