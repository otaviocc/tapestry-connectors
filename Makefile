.PHONY: all clean

CONNECTORS := $(wildcard cc.otavio.*)
TAPESTRY_FILES := $(addsuffix .tapestry,$(CONNECTORS))

all: $(TAPESTRY_FILES)

%.tapestry: %/plugin-config.json
	@echo "Building $@"
	@cd $* && zip -qr ../$@ .

clean:
	@echo "Cleaning up"
	@rm -f *.tapestry
