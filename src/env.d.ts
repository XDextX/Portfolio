/// <reference types="astro/client" />

declare namespace App {
	interface Locals {
		/** Spec 015: the plain submit's result, set by index.astro on POST. */
		contact?: import("./pages/lib/contact").ContactResult;
	}
}
