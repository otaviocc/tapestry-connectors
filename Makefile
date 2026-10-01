CONNECTORS := $(patsubst %/plugin-config.json,%,$(wildcard cc.otavio.*/plugin-config.json))
TAPESTRY_FILES := $(addsuffix .tapestry,$(CONNECTORS))

.PHONY: all clean $(TAPESTRY_FILES)

all: $(TAPESTRY_FILES)

# Always rebuilt from scratch, so deleted files don't linger in the archive
$(TAPESTRY_FILES): %.tapestry:
	@echo "Building $@"
	@rm -f $@
	@cd $* && zip -qr ../$@ . -x '.DS_Store'

clean:
	@echo "Cleaning up"
	@rm -f *.tapestry
