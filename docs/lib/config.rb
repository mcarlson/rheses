#!/usr/bin/env ruby

require 'json'

LIB_DIR  = File.expand_path(File.dirname(__FILE__))
DOCS_DIR = LIB_DIR[/(.*?)\/lib/, 1]

module Dreem
  class GuideBuilder

    def self.build(guides_dir)
      items = Dir["#{guides_dir}/**/README.md"].map do |readme|
        file = File.open(readme).read
        name = readme[%r{/([^/]+)/README.md$}, 1]
        title = file[/# (.*)$/, 1]
        description = file[%r{\[//\]: # (.*)$}, 1]

        {
            name: name,
            url: "guides/#{name}",
            title: title,
            description: description
        }

      end

      {
          title: "Dreem Guides",
          items: items
      }

    end

  end

  class CategoriesBuilder
    def self.build()

    end
  end
end

guides = Dreem::GuideBuilder.build("#{DOCS_DIR}/guides")

File.open("#{DOCS_DIR}/guides.json", "w") { |f| f.write [guides].to_json }
