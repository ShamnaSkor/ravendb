var RavenStudio;
(function (RavenStudio) {
    var DataTable = (function () {
        function DataTable(tableSelector) {
            this.tableSelector = tableSelector;
            var _this = this;
            this.rows = ko.observableArray();
            this.columns = ko.observableArray();
            this.skip = 0;
            this.take = 100;
            this.totalRowsCount = 0;
            this.isLoading = ko.observable(false);
            this.selectionStack = [];
            this.fetchNextChunk();
            this.sizeTable();
            this.allRowsChecked = ko.computed({
                read: function () {
                    return _this.rows().length > 0 && _this.rows().every(function (r) {
                        return r.isChecked();
                    });
                },
                write: function (val) {
                    return _this.rows().forEach(function (r) {
                        return r.isChecked(val);
                    });
                }
            });
            $(window).resize(function () {
                return _this.sizeTable();
            });
            $(tableSelector).scroll(function () {
                return _this.loadMoreIfNeeded();
            });
        }
        DataTable.prototype.sizeTable = function () {
            var tableElement = $(this.tableSelector);
            var footerTop = $("footer").position().top;
            var tableTop = tableElement.position().top;
            var bottomPadding = 40;
            tableElement.height(footerTop - tableTop - bottomPadding);
        };
        DataTable.prototype.fetchNextChunk = function () {
            var _this = this;
            if(this.isLoading()) {
                return;
            }
            this.isLoading(true);
            var results = this.createDummyResults();
            setTimeout(function () {
                return _this.nextChunkFetched({
                    Items: results,
                    TotalItems: 342
                });
            }, Math.random() * 1000);
        };
        DataTable.prototype.nextChunkFetched = function (results) {
            var _this = this;
            this.totalRowsCount = results.TotalItems;
            this.createCellsForColumns(this.rows(), this.getPropertyNames(results.Items));
            var rows = results.Items.map(function (row) {
                var cells = _this.columns().map(function (c) {
                    return new Cell(_this.getTemplateForCell(c, row), row[c]);
                });
                return new Row(ko.observableArray(cells));
            });
            this.streamInRows(rows, function () {
                _this.skip += results.Items.length;
                _this.isLoading(false);
            });
        };
        DataTable.prototype.getPropertyNames = function (objects) {
            var propertyNames = [];
            objects.forEach(function (f) {
                for(var property in f) {
                    if(propertyNames.indexOf(property) == -1) {
                        propertyNames.push(property);
                    }
                }
            });
            return propertyNames;
        };
        DataTable.prototype.createCellsForColumns = function (rows, columns) {
            var _this = this;
            var columnCount = this.columns().length;
            var newColumns = columns.filter(function (c) {
                return _this.columns().indexOf(c) === -1;
            });
            if(newColumns.length > 0) {
                var createCells = function () {
                    return newColumns.map(function (c) {
                        return new Cell("default-cell-template", "");
                    });
                };
                this.columns.pushAll(newColumns);
                rows.forEach(function (r) {
                    return r.cells.pushAll(createCells());
                });
            }
        };
        DataTable.prototype.toggleChecked = function (row, e) {
            row.isChecked(!row.isChecked());
            var rowIndex = this.rows.indexOf(row);
            if(row.isChecked()) {
                this.selectionStack.unshift(row);
            } else {
                var indexOfRemovedItem = this.selectionStack.indexOf(row);
                if(indexOfRemovedItem >= 0) {
                    this.selectionStack.splice(indexOfRemovedItem, 1);
                }
            }
            if(e && e.shiftKey && this.selectionStack.length > 1) {
                var newSelectionState = row.isChecked();
                var previousSelectionIndex = this.rows.indexOf(newSelectionState ? this.selectionStack[1] : this.selectionStack[0]);
                var validIndices = rowIndex >= 0 && previousSelectionIndex >= 0 && rowIndex != previousSelectionIndex;
                if(validIndices) {
                    this.rows.slice(Math.min(rowIndex, previousSelectionIndex), Math.max(rowIndex, previousSelectionIndex)).forEach(function (r) {
                        return r.isChecked(newSelectionState);
                    });
                }
            }
        };
        DataTable.prototype.getTemplateForCell = function (columnName, row) {
            if(columnName == "Id") {
                return "colored-id-cell-template";
            }
            if(row[columnName]) {
                var matches = row[columnName].toString().match(/\w+\/\d+/);
                var looksLikeId = matches && matches[0] == row[columnName];
                if(looksLikeId) {
                    return "id-cell-template";
                }
            }
            return "default-cell-template";
        };
        DataTable.prototype.toggleAllRowsChecked = function () {
            this.allRowsChecked(!this.allRowsChecked());
        };
        DataTable.prototype.loadMoreIfNeeded = function () {
            if(!this.isLoading() && this.rows().length < this.totalRowsCount) {
                var table = $(this.tableSelector);
                var tableBottom = table.position().top + table.height();
                var lastRowPos = $(this.tableSelector + " .document-row:last-child").position();
                var nearPadding = 500;
                var lastRowIsVisible = lastRowPos && (lastRowPos.top - nearPadding) < tableBottom;
                if(lastRowIsVisible) {
                    this.fetchNextChunk();
                }
            }
        };
        DataTable.prototype.streamInRows = function (rowsToAdd, doneCallback) {
            var _this = this;
            var chunkSize = 5;
            var removedRows = rowsToAdd.splice(0, chunkSize);
            this.rows.pushAll(removedRows);
            if(rowsToAdd.length > 0) {
                setTimeout(function () {
                    return _this.streamInRows(rowsToAdd, doneCallback);
                }, 1);
            } else {
                doneCallback();
            }
        };
        DataTable.prototype.createDummyResults = function () {
            var results = [];
            for(var i = 0; i < this.take; i++) {
                var random = Math.random();
                var item = null;
                if(random < 0.2) {
                    item = {
                        Id: "likes/" + (i + 1),
                        LikeStatus: random < 0.1 ? "Like" : "Dislike",
                        Date: "2013-01-22T23:29:03.1445000",
                        SongId: "songs/" + (i + 5),
                        UserId: "users/" + (i + 42)
                    };
                } else {
                    if(random < 0.4) {
                        item = {
                            Id: "songs/" + (i + 1),
                            FileName: "aasdfasdf dwe",
                            Name: "Habedesharie",
                            Album: "Some Rand Album",
                            AlbumArtUri: null,
                            Artist: "The Beatles",
                            CommunityRank: Math.floor(100 * random)
                        };
                    } else {
                        if(random < 0.6) {
                            item = {
                                Id: "visits/" + (i + 1),
                                DateTime: "2013-01-22T23:29:03.1445000",
                                TotalPlays: Math.floor(random * 100),
                                UserId: "users/" + (i + 1)
                            };
                        } else {
                            if(random < 0.8) {
                                item = {
                                    Id: "users/" + (i + 1),
                                    ClientIdentifier: i + "2013-01-22T23:29:03.1445000",
                                    Preferences: "fasdf asdf asdfeqwerasdf eqwefasdfasdf",
                                    TotalPlays: Math.floor(random * 1000)
                                };
                            } else {
                                item = {
                                    Id: "logs/" + i,
                                    Message: i + "qehqwet q asdfeqweerasdf eqwefasdfasdf",
                                    TimeStamp: "2013-01-22T23:29:03.1445000"
                                };
                            }
                        }
                    }
                }
                results.push(item);
            }
            return results;
        };
        return DataTable;
    })();
    RavenStudio.DataTable = DataTable;    
    var Row = (function () {
        function Row(cells) {
            this.cells = cells;
            this.isChecked = ko.observable(false);
        }
        return Row;
    })();
    RavenStudio.Row = Row;    
    var Cell = (function () {
        function Cell(templateName, value) {
            this.templateName = templateName;
            this.value = value;
        }
        return Cell;
    })();
    RavenStudio.Cell = Cell;    
})(RavenStudio || (RavenStudio = {}));
