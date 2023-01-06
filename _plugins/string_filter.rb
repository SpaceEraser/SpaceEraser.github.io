module Jekyll
  module StringFilter
    def end_with(text, query)
      text.end_with? query
    end
  end
end

Liquid::Template.register_filter(Jekyll::StringFilter)
