/// <reference path="../../Scripts/typings/bootstrap/bootstrap.d.ts" />
define(["require", "exports", "plugins/router", "durandal/app", "durandal/system", "models/database", "common/raven", "models/document", "models/collection", "common/alertArgs", "common/alertType"], function(require, exports, __router__, __app__, __sys__, __database__, __raven__, __document__, __collection__, __alertArgs__, __alertType__) {
    var router = __router__;
    var app = __app__;
    var sys = __sys__;

    var database = __database__;
    var raven = __raven__;
    var document = __document__;
    var collection = __collection__;
    
    
    var alertArgs = __alertArgs__;
    var alertType = __alertType__;

    var shell = (function () {
        function shell() {
            var _this = this;
            this.router = router;
            this.databases = ko.observableArray();
            this.activeDatabase = ko.observable().subscribeTo("ActivateDatabase");
            this.currentAlert = ko.observable();
            this.queuedAlerts = ko.observableArray();
            this.ravenDb = new raven();
            ko.postbox.subscribe("EditDocument", function (args) {
                return _this.launchDocEditor(args.doc.getId());
            });
            ko.postbox.subscribe("Alert", function (alert) {
                return _this.showAlert(alert);
            });
        }
        shell.prototype.databasesLoaded = function (databases) {
            var systemDatabase = new database("<system>");
            systemDatabase.isSystem = true;
            this.databases(databases.concat([systemDatabase]));
            this.databases()[0].activate();
        };

        shell.prototype.launchDocEditor = function (docId) {
            router.navigate("#edit?id=" + encodeURIComponent(docId));
        };

        shell.prototype.activate = function () {
            var _this = this;
            router.map([
                { route: '', title: 'Databases', moduleId: 'viewmodels/databases', nav: false },
                { route: 'documents', title: 'Documents', moduleId: 'viewmodels/documents', nav: true },
                { route: 'indexes', title: 'Indexes', moduleId: 'viewmodels/indexes', nav: true },
                { route: 'query', title: 'Query', moduleId: 'viewmodels/query', nav: true },
                { route: 'tasks', title: 'Tasks', moduleId: 'viewmodels/tasks', nav: true },
                { route: 'settings', title: 'Settings', moduleId: 'viewmodels/settings', nav: true },
                { route: 'status', title: 'Status', moduleId: 'viewmodels/status', nav: true },
                { route: 'edit', title: 'Edit Document', moduleId: 'viewmodels/editDocument', nav: false }
            ]).buildNavigationModel();

            // Activate the first page only after we've connected to Raven
            // and selected the first database.
            return this.ravenDb.databases().fail(function (result) {
                sys.log("Unable to connect to Raven.", result);
                app.showMessage("Couldn't connect to Raven. Details in the browser console.", ":-(", ['Dismiss']);
                $('.splash').hide();
            }).done(function (results) {
                return _this.databasesLoaded(results);
            }).then(function () {
                return router.activate();
            });
        };

        shell.prototype.showAlert = function (alert) {
            var _this = this;
            var currentAlert = this.currentAlert();
            if (currentAlert) {
                // Maintain a 500ms time between alerts; otherwise successive alerts can fly by too quickly.
                this.queuedAlerts.push(alert);
                if (currentAlert.type !== alertType.danger) {
                    setTimeout(function () {
                        return _this.closeAlertAndShowNext(_this.currentAlert());
                    }, 500);
                }
            } else {
                this.currentAlert(alert);
                var fadeTime = 2000;
                if (alert.type === alertType.danger || alert.type === alertType.warning) {
                    fadeTime = 5000;
                }
                setTimeout(function () {
                    return _this.closeAlertAndShowNext(alert);
                }, fadeTime);
            }
        };

        shell.prototype.closeAlertAndShowNext = function (alertToClose) {
            var _this = this;
            $('#' + alertToClose.id).alert('close');
            var nextAlert = this.queuedAlerts.pop();
            setTimeout(function () {
                return _this.currentAlert(nextAlert);
            }, 500);
        };
        return shell;
    })();

    
    return shell;
});
//# sourceMappingURL=shell.js.map
