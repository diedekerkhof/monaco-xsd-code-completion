import * as xpath from 'xpath'
import { DOMParser } from 'xmldom'
import { SelectedValue } from 'xpath'
import DocumentNode from './models/DocumentNode'

export default class XSDParser {
    private readonly xsdDom: Document
    private readonly select: xpath.XPathSelect

    constructor(xsdString: string) {
        this.xsdDom = new DOMParser().parseFromString(xsdString)
        // TODO: Multiple namespaces.
        this.select = xpath.useNamespaces({
            xs: 'http://www.w3.org/2001/XMLSchema',
        })
    }

    getRootElements = (): DocumentNode[] =>
        this.parseElements(this.select(`/xs:schema/xs:element`, this.xsdDom))

    getSubElements = (elementName: string): DocumentNode[] =>
        this.parseElements(
            this.select(`//xs:complexType[@name='${elementName}Type']//xs:element`, this.xsdDom),
        )

    getAttributesForElement = (elementName: string): DocumentNode[] =>
        this.parseAttributes(
            this.select(`//xs:complexType[@name='${elementName}Type']/xs:attribute`, this.xsdDom),
        )

    parseElements = (elements: SelectedValue[]): DocumentNode[] =>
        elements.map(
            (element: SelectedValue): DocumentNode => this.getAttributesForNode(<Node>element),
        )

    parseAttributes = (attributes: SelectedValue[]): DocumentNode[] =>
        attributes.map(
            (attribute: SelectedValue): DocumentNode => ({
                ...this.getAttributesForNode(<Node>attribute),
                ...this.getDocumentationForNode(<Node>attribute)[0],
            }),
        )

    getAttributesForNode = (node: Node): any =>
        this.select('@*', node).reduce(
            (acc: {}, curr: any): any => ({ ...acc, [curr.name]: curr.value }),
            {},
        )

    getDocumentationForNode = (attribute: Node): any =>
        this.select(`xs:annotation/xs:documentation`, attribute).map((documentation: any): any =>
            'firstChild' in documentation ? { documentation: documentation.firstChild.data } : null,
        )
}
