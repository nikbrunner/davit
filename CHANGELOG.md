# Changelog

## [0.2.0](https://github.com/nikbrunner/davit/compare/v0.1.0...v0.2.0) (2026-03-17)


### Features

* add config init and show commands ([f8d541f](https://github.com/nikbrunner/davit/commit/f8d541f69f4b7590dc9a91d51355ef7924f0254c))
* add location and url fields to event types ([b9e481b](https://github.com/nikbrunner/davit/commit/b9e481bd4f9ac7e31c75898a46fe36511db79d71))
* add LOCATION and URL to iCal builder and parser ([e263e2b](https://github.com/nikbrunner/davit/commit/e263e2bdc50738c38470f41c8ebdafbd85e14266))
* wire location and url through events, CLI, and formatters ([96062d2](https://github.com/nikbrunner/davit/commit/96062d20f069664cb43d8f5206ca6ff112aa463d))


### Refactors

* remove MCP layer, ship as CLI-only tool ([4378fc5](https://github.com/nikbrunner/davit/commit/4378fc534db7ec9ca9cb1aa93f7717570102e1e7))


### Bug Fixes

* add DTSTAMP to iCal builder per RFC 5545 ([d2d34dc](https://github.com/nikbrunner/davit/commit/d2d34dcde6af611e9da804cbc2d8b92a275b8445))
* add RFC 5545 line unfolding to iCal parser ([9af1ba3](https://github.com/nikbrunner/davit/commit/9af1ba37bc42c332638d103ac699510b4ac159aa))
* fold long iCal lines at 75 octets per RFC 5545 ([6cb0961](https://github.com/nikbrunner/davit/commit/6cb0961f343e291b861ce983459a689eea4def02))
* list events from all calendars when none specified ([919f077](https://github.com/nikbrunner/davit/commit/919f077810eec993e7b9af93d82fc31cb54f5516))
* pass undefined etag instead of empty string to tsdav ([b8832c3](https://github.com/nikbrunner/davit/commit/b8832c3b4d1a48ae20d210b3a1c300a0717a743c))


### Documentation

* clarify davit works with any CalDAV server, not just iCloud ([70b5ba1](https://github.com/nikbrunner/davit/commit/70b5ba16b4810c1289e066446ae6fdac0bd6b258))
* document config file setup with env var password resolution ([9c69ef3](https://github.com/nikbrunner/davit/commit/9c69ef38d063f6f0cf5695e2018cb725e807b85c))
* reorganize README with install and usage sections ([211f479](https://github.com/nikbrunner/davit/commit/211f47998d3d778eb72803386d7db58a0817d6ea))


### Performance

* accept --calendar in show/update/delete to narrow event search ([ac818b9](https://github.com/nikbrunner/davit/commit/ac818b9e0020700a5195ada56f62878e7fcc3b38))
